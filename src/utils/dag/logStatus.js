import { filter, mapObjIndexed, resolve, not, isEmpty } from '@serverless/utils'

function getParameters(instance) {
  if (instance.inputs && instance.inputTypes) {
    const requiredParams = filter((inputType) => !!inputType.required, instance.inputTypes)
    const paramsAsObject = mapObjIndexed(
      (num, key) => resolve(instance.inputs[key]),
      requiredParams
    )
    if (not(isEmpty(paramsAsObject))) {
      return JSON.stringify(paramsAsObject, null, 2)
        .replace(/[\{\}]/g, '')
        .slice(0, -1)
    }
    return paramsAsObject
  }
}

function logCurrentStatus(iteratee, node, context) {
  const { prevInstance, nextInstance } = node

  const componentName =
    (nextInstance && nextInstance.constructor.name) ||
    (prevInstance && prevInstance.constructor.name)

  if (iteratee.name === 'deployNode') {
    const params = getParameters(nextInstance)
    context.log(
      `Deploying "${componentName}" ${not(isEmpty(params)) ? `with parameters: ${params}` : ''}`
    )
  } else if (iteratee.name === 'removeNode') {
    if (prevInstance) {
      const params = getParameters(prevInstance)
      context.log(
        `Removing "${componentName}" ${not(isEmpty(params)) ? `with parameters: ${params}` : ''}`
      )
    }
  }
}

export default logCurrentStatus
