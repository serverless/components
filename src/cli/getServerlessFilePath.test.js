'use strict';

const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { expect } = require('chai');

const lstat = sinon.stub().resolves({ isFile: () => true });
const getServerlessFilePath = proxyquire('./getServerlessFilePath', {
  'fs-extra': { lstat },
});

describe('getServerlessFilePath', () => {
  it('returns the serverless.yml first', async () => {
    const serverlessFilePath = await getServerlessFilePath(undefined, '/foobar');
    expect(serverlessFilePath).to.equal('/foobar/serverless.yml');
    expect(lstat.calledWith('/foobar/serverless.yml')).to.be.true;
    expect(lstat.calledWith('/foobar/serverless.yaml')).to.be.true;
    expect(lstat.calledWith('/foobar/serverless.json')).to.be.true;
    expect(lstat.calledWith('/foobar/serverless.js')).to.be.true;
  });

  it('returns the custom.yml first', async () => {
    const serverlessFilePath = await getServerlessFilePath('custom.yml', '/foobar');
    expect(serverlessFilePath).to.equal('/foobar/custom.yml');
    expect(lstat.calledWith('/foobar/custom.yml'));
  });
});
