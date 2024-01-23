export const hashEndpoint = ({ route, method }: { route: string; method: string }): string => {
  return `{${method}} ${route}`;
};
