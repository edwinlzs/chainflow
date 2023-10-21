// import { describe, it, mock } from "node:test";
// import http from "../http";
// import assert from "node:assert";
// import undici from "undici";

// describe('#http', () => {
//   describe('when an invalid payload body is passed in', () => {
//     it('should fail to execute the call', async () => {
//       const tracker = mock.method(undici, 'request');
//       await http.httpReq({
//         addr: '127.0.0.1',
//         path: '/',
//         method: 'POST',
//         body: 96,
//       });
//       console.log(JSON.stringify(tracker.mock.calls));
//       assert.ok(tracker.mock.calls[0].error);
//     });
//   });
// });
