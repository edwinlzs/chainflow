/** Script to prepare generated docs for embedding into chainflow-docs site */
import fs from 'fs';

const DOCS_FOLDER = './docs/api';
const MD_LINK_RELATIVE_PATH_REGEX = /\[((?:[^\])])+)\]\((?:https*:\/\/){0}([\w\d./?=#]+)\)/g;
const CD_PARENT_DIR_REGEX = /(\.\.\/)/g;
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

const postprocess = (filename: string, currentDir: string) => {
  let content: string = fs.readFileSync(filename).toString();

  // Don't touch the README content
  let isReadMe = false;
  let readMeContent: string[] = [];
  if (filename.endsWith('README.md') && content.includes('<!-- README -->')) {
    isReadMe = true;
    readMeContent = content.split('<!-- README -->');
    content = readMeContent[0];
  }

  const subPath = currentDir.replace(DOCS_FOLDER, ''); // for files in nested dirs
  content = content.replace(MD_LINK_RELATIVE_PATH_REGEX, updateRelativeLink(subPath));
  content = content.replace(
    MD_EXTENSION_LINK_REGEX,
    (_match: string, _ext: string, end: string) => end,
  );

  if (isReadMe) content = `${content}<!-- README -->${readMeContent[1]}`;
  fs.writeFileSync(filename, content);
};

const updateRelativeLink = (_subPath: string) => (match: string, _text: string, link: string) => {
  // const numCdParent = [...link.matchAll(CD_PARENT_DIR_REGEX)].length;

  // if (numCdParent) {
  //   let dirs = subPath.split('/');
  //   if (dirs.length < numCdParent)
  //     throw Error(`Something wrong with number of ../ versus subpath ${subPath}`);
  //   subPath = dirs.slice(0, dirs.length - numCdParent).join('/');
  // }

  // let strippedLink = link.replace(CD_PARENT_DIR_REGEX, '');
  // return match.replace(link, `/docs${subPath}/${strippedLink}`);
  
  if (link.match(CD_PARENT_DIR_REGEX) !== null) return match;
  return match.replace(link, `./${link}`);
};

findFiles(DOCS_FOLDER, isMdFile, postprocess);
