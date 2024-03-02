/** @todo explore improving this */
export const getEndpointId = ({ route, method }: { route: string; method: string }): string => {
  return `{${method}} ${route}`;
};
