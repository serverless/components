const BbPromise = require('bluebird')

const BbPromiseMock = jest.genMockFromModule('bluebird')

BbPromise.delay = BbPromiseMock.delay

module.exports = BbPromise

