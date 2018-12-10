import { filter, assoc, reduce, resolve, not, isEmpty } from '@serverless/utils'

function getParameters(instance) {
  if (instance.inputs && instance.inputTypes) {
    const requiredParams = filter((inputType) => !!inputType.required, instance.inputTypes)
    const paramsAsObject = reduce(
      (accum, _, key) => {
        const value = resolve(instance.inputs[key])
        // TODO: replace with a universal util function which checks whether we're
        // dealing with a Component, Object, Provider, etc. instance here
        // omitting own Types due to circular structure / verbosity here
        if (!(value.name && value.version)) {
          return assoc(key, value, accum)
        }
        return accum
      },
      {},
      requiredParams
    )

    if (not(isEmpty(paramsAsObject))) {
      return JSON.stringify(paramsAsObject, null, 2)
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
