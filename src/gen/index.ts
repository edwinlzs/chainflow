// import parser from '@apidevtools/swagger-parser';
// import { generateRoutes, log } from './routegen';

// const specPath = './src/templates/openapi.json';

// export const gen = async () => {
//   try {
//     const spec = await parser.validate(specPath, {
//       dereference: { circular: 'ignore' },
//     });
//     const routes = generateRoutes(spec);
//     log('Successfully generated routes.');
//     return routes;
//   } catch (err) {
//     log(err);
//   }
// };

// if (typeof module !== 'undefined' && module.children) {
//   // this is the main module
//   gen();
// }
