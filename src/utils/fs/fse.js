const fsExtra = require('fs-extra')
const BbPromise = require('bluebird')

module.exports = BbPromise.promisifyAll(fsExtra)
