import { filter, assoc, reduce, resolve, not, isEmpty } from '@serverless/utils'

function getParameters(instance) {
  if (instance.inputs && instance.inputTypes) {
    const requiredParams = filter((inputType) => !!inputType.required, instance.inputTypes)
    let paramsAsObject = reduce(
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
      try {
        paramsAsObject = JSON.stringify(paramsAsObject, null, 2)
      } catch (error) {
        // simply reassign to an empty object
        paramsAsObject = {}
      } finally {
        return paramsAsObject
      }
    }
    return paramsAsObject
  }
}

function logStatus(iteratee, node, context) {
  const { prevInstance, nextInstance } = node

  const component = nextInstance ? nextInstance : prevInstance
  const componentName = component.constructor.name

  const rootComponents = ['App', 'Compute', 'Cron', 'Function', 'Plugin', 'Service']

  if (!rootComponents.includes(component.extends)) {
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
}

export default logStatus
