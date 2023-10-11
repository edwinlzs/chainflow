import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Route } from '../route';
import { Endpoint } from '../endpoint';

describe('#route', () => {
  it('should save endpoints by their method name', () => {
    const endpoint = new Endpoint({ route: '/user', method: 'get' });
    const testRoute = new Route([endpoint]);
    assert.equal(testRoute['get'], endpoint);
  });
});
