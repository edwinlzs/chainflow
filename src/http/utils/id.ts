/** @todo explore improving this */
export const getEndpointId = ({ url, method }: { url: string; method: string }): string => {
  return `[${method.toUpperCase()}] ${url}`;
};
