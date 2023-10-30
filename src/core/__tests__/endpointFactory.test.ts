import { describe, it } from 'node:test';
import assert from 'node:assert';
import { endpointFactory } from '../endpointFactory';

describe('#endpointFactory', () => {
  it('should create endpoints with HTTP methods based on the class method used', () => {
    const testFactory = endpointFactory();
    assert.equal(testFactory.get('/').method, 'get');
  });
});
