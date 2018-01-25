const AWS = require('aws-sdk')
const path = require('path')
const R = require('ramda')
const BbPromise = require('bluebird')
const utils = require('./utils')

const { readFile, fileExists, writeFile } = utils
const { reduce, mergeDeepRight } = R

const getNestedComponentsRoots = (componentNames = []) => componentNames.map((componentName) => path.join(process.cwd(), '..', 'registry', componentName))
const getState = async (componentRoot) => {
  const stateFilePath = path.join(componentRoot, 'state.json')

  if (!await fileExists(stateFilePath)) {
    return {}
  }
  const state = await readFile(stateFilePath)
  return state
}

const updateState = (componentRoot, config) => {
  const stateFilePath = path.join(componentRoot, 'state.json')
  return writeFile(stateFilePath, config)
}

const provision = async (componentRoot = process.cwd(), config = {}) => {
  const slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))
  config = mergeDeepRight(slsYml.config || {}, config)
  const nestedComponentsRoots = getNestedComponentsRoots(slsYml.components)
  const state = await getState(componentRoot)

  const reducer = async (configAccumPromised, componentRoot) => {
    const configAccum = await Promise.resolve(configAccumPromised)
    const nestedComponentConfig = await provision(componentRoot, configAccum)
    return mergeDeepRight(configAccum, nestedComponentConfig)
  }

  const nestedComponentsConfig = await reduce(reducer, Promise.resolve(config), nestedComponentsRoots)

  const thisComponent = require(path.join(componentRoot, 'index.js'))
  const thisComponentConfig = await thisComponent(config, state)

  config = mergeDeepRight(thisComponentConfig, nestedComponentsConfig)

  await updateState(componentRoot, config)

  return config
}

module.exports = {
  provision,
  AWS,
  BbPromise,
  ...utils
}

/*
 * problems to solve
 * - inputs and outputs for all components, what if keys clash and overwride each other?
 * - how to wait for aws?
 * - how to use the same component twice? and pass them different config. ie two dynamo tables with two different names
 * - how components pass status back to the CLI? and between each other?
 * - how to speed deployment and run as much as possible in parallel?
 */
