/*
 * SERVERLESS COMPONENTS: CORE
 */

const utils = require('../utils')
const Component = require('./Component')
const Instance = require('./Instance')
const { ServerlessClient } = require('@serverless/platform-client')

class ServerlessComponents extends ServerlessClient {

  /**
   * Finds an access key on the local machine or creates one
   * @param {*} orgName 
   */
  async getOrCreateAccessKey(orgName) {
    return await utils.getOrCreateAccessKey(orgName)
  }

  /**
   * Returns a new instance or one loaded from a directory path
   * @param {*} directoryPath 
   */
  instance(directoryPath) {
    const instance = new Instance(this)
    if (directoryPath) {
      instance.load(directoryPath)
    }
    return instance
  }

  /**
   * Returns a new component or one loaded from a directory path
   */
  component(directoryPath) {
    const component = new Component(this)
    if (directoryPath) {
      component.load(directoryPath)
    }
    return component
  }
}

module.exports = ServerlessComponents