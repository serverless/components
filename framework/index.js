const AWS = require('aws-sdk')
const path = require('path')
const R = require('ramda')
const BbPromise = require('bluebird')
const utils = require('./utils')

const { readFile, fileExists, writeFile } = utils
const { reduce, mergeDeepRight, mapObjIndexed, is, keys, map, contains, not, test, match, replace } = R

const getState = async (componentRoot) => {
  const stateFilePath = path.join(componentRoot, 'state.json')

  if (!await fileExists(stateFilePath)) {
    return {}
  }
  const state = await readFile(stateFilePath)
  return state
}

const updateState = (componentRoot, inputs) => {
  const stateFilePath = path.join(componentRoot, 'state.json')
  return writeFile(stateFilePath, inputs)
}

const resolveNestedComponentsRoots = (components) => {
  const nestedComponentsArray = []
  mapObjIndexed((componentObj, componentAlias) => {
    componentObj.alias = componentAlias
    componentObj.root = path.join(process.cwd(), '..', 'registry', componentObj.type)
    nestedComponentsArray.push(componentObj)
    return componentObj
  }, components)

  return nestedComponentsArray
}

const resolveOutputReferences = (inputs, outputs) => {
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value) && test(regex, value)) {
      const referencedOutput = replace(/[${}]/g, '', match(regex, value)[0]) // todo support multiple matches in single value?
      if (referencedOutput.split(':').length === 1) {
        return process.env[referencedOutput]
      }
      const referencedComponentAlias = referencedOutput.split(':')[0]
      const referencedOutputKey = referencedOutput.split(':')[1] // todo support deep nested outputs?

      if (not(contains(referencedComponentAlias, keys(outputs)))) {
        throw new Error(`Component "${referencedComponentAlias}" does not exist or has not yet been provisioned`)
      }
      if (not(contains(referencedOutputKey, keys(outputs[referencedComponentAlias])))) {
        throw new Error(`Component "${referencedComponentAlias}" does not output "${referencedOutputKey}"`)
      }
      return outputs[referencedComponentAlias][referencedOutputKey]
    }
    return value
  }
  return map(resolveValue, inputs)
}

const Components = async (deploy = true, componentRoot = process.cwd(), inputs = {}) => {
  const slsYml = await readFile(path.join(componentRoot, 'serverless.yml'))
  inputs = mergeDeepRight(slsYml.inputs || {}, inputs)
  const nestedComponents = resolveNestedComponentsRoots(slsYml.components || {})
  let state = await getState(componentRoot)

  const reducer = async (accum, component) => {
    accum = await Promise.resolve(accum)
    component.inputs = resolveOutputReferences(component.inputs || {}, accum)
    const nestedComponentOutputs = await Components(deploy, component.root, component.inputs)
    accum[component.alias] = nestedComponentOutputs
    return accum
  }

  const nestedComponentsOutputs = await reduce(reducer, Promise.resolve({}), nestedComponents)

  inputs = resolveOutputReferences(inputs, nestedComponentsOutputs)

  const thisComponent = require(path.join(componentRoot, 'index.js'))

  if (!deploy) {
    inputs = {}
  }
  const outputs = await thisComponent(inputs, state)
  state = mergeDeepRight(inputs, outputs)
  await updateState(componentRoot, state)
  return outputs
}

const runCommand = async (command) => {
  const commandLogicPath = path.join(process.cwd(), `${command}.js`)

  if (!await fileExists(commandLogicPath)) {
    throw new Error(`Command ${command} does not exist`)
  }

  const commandLogic = require(commandLogicPath)

  const state = await getState(process.cwd())

  return commandLogic({}, state) // todo, resolve inputs
}

module.exports = {
  Components,
  runCommand,
  AWS,
  BbPromise,
  ...utils
}
