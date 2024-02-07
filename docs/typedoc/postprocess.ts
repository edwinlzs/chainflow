/** Script to prepare generated docs for embedding into chainflow-docs site */
import fs from 'fs';

const DOCS_FOLDER = './docs/api';
const MD_EXTENSION_LINK_REGEX = /(\.md(\)|#))/g;

const findFiles = (
  currentDir: string,
  filter: (path: string) => boolean,
  callback: (filename: string, currentDir: string) => void,
) => {
  const paths = fs.readdirSync(currentDir);

  paths.forEach((path: string) => {
    const filename = `${currentDir}/${path}`;

    if (filter(path)) {
      return callback(filename, currentDir);
    }

    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      findFiles(filename, filter, callback);
    }
  });
};

const isMdFile = (path: string): boolean => {
  const parts = path.split('.');
  return parts.length > 1 && parts[parts.length - 1] === 'md';
};

const postprocess = (filename: string) => {
  let content: string = fs.readFileSync(filename).toString();

  // Don't touch the README content
  let isReadMe = false;
  let readMeContent: string[] = [];
  if (filename.endsWith('README.md') && content.includes('<!-- README -->')) {
    isReadMe = true;
    readMeContent = content.split('<!-- README -->');
    content = readMeContent[0];
  }

  content = content.replace(
    MD_EXTENSION_LINK_REGEX,
    (_match: string, _ext: string, end: string) => end,
  );

  if (isReadMe) content = `${content}<!-- README -->${readMeContent[1]}`;
  fs.writeFileSync(filename, content);
};

findFiles(DOCS_FOLDER, isMdFile, postprocess);
