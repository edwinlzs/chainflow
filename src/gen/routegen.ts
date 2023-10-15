import { Endpoint } from '../core/endpoint.js';
import { Route } from '../core/route.js';
import debug from 'debug';

export const log = debug('chainflow:routegen');

/** Given an API spec, generate route objects */
export const generateRoutes = (spec: any) => {
  const routes: Record<string, Route> = {};
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, rawEndpoints]) => {
      const endpoints: Endpoint[] = [];
      if (rawEndpoints) {
        Object.entries(rawEndpoints).forEach(([method, details]) => {
          const endpoint = new Endpoint({ path, method });
          endpoint.body = getReqPayload(details);
          endpoint.res = getResPayload(details);
          endpoints.push(endpoint);
        });
      }
      endpoints.length > 0 && (routes[getPathName(path)] = new Route(endpoints));
    });
  }

  return routes;
};

/** Creates path name in camel case without slashes. */
const getPathName = (path: string): string => {
  if (path.charAt(0) === '/') {
    path = path.slice(1);
  }
  const parts = path.split('/');
  if (parts.length === 0) return 'root';
  if (parts.length > 1) {
    return [
      parts[0],
      ...parts.slice(1).map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
    ].join('');
  }
  return parts[0]!;
};

/** Extracts default request payload from spec. */
const getReqPayload = (details: any) => {
  const schema = getReqSchema(details?.requestBody);
  // currently only able to handle object schema
  if (!(schema && schema.type === 'object' && schema.properties)) {
    return {};
  }
  return constructPropObject(schema.properties);
};

/** Extracts default response payload from spec. */
const getResPayload = (details: any) => {
  const schema = getResSchema(details?.responses);
  // currently only able to handle object schema
  if (!(schema && schema.type === 'object' && schema.properties)) {
    return {};
  }
  return constructPropObject(schema.properties);
};

const constructPropObject = (props: any) => {
  return Object.entries(props).reduce((acc, [propName, propInfo]) => {
    const propVal = getPropVal(propInfo);
    if (!propVal) return acc;
    acc[propName] = propVal;
    return acc;
  }, {} as any);
};

/** Resolves property info into a default value. */
const getPropVal = (propInfo: any) => {
  if (propInfo.example) return propInfo.example;
  if (!propInfo.type) return null;

  switch (propInfo.type) {
    case 'object':
      if (!propInfo.properties) return null;
      return constructPropObject(propInfo.properties);
  }
};

/** Extracts schema from request body in spec */
const getReqSchema = (reqBody: any) => {
  return reqBody?.content?.['application/json']?.schema;
};

/** Extracts schema from response body in spec */
const getResSchema = (responses: any) => {
  const targetResponse = responses?.['200'] || responses?.default;
  return targetResponse?.content?.['application/json']?.schema;
};
