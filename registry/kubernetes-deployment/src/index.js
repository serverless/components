const k8s = require('@kubernetes/client-node')

const kubeConfig = new k8s.KubeConfig()
kubeConfig.loadFromDefault()
const kubeClient = kubeConfig.makeApiClient(k8s.Apps_v1Api)

const deploy = async (inputs, context) => {
  const { state } = context
  const { namespace, name, metadata, ...spec } = inputs

  const params = { metadata: { ...metadata, name }, spec }
  if (state && state.metadata && state.metadata.name && state.metadata.namespace) {
    if (state.metadata.name !== name || state.metadata.namespace !== namespace) {
      await remove(inputs, context)
    } else {
      return {}
    }
  }

  context.log(`Creating Kubernetes Deployment "${name}"`)
  const { body } = await kubeClient.createNamespacedDeployment(namespace, params).catch((resp) => {
    context.log(resp.body.message)
    throw new Error(JSON.stringify(resp.body))
  })
  context.saveState(body || {})
  await get(inputs, { ...context, state: body })
  return {}
}

const remove = async (inputs, context) => {
  const { state } = context
  if (!state || !state.metadata || !state.metadata.name || !state.metadata.namespace) {
    return {}
  }

  context.log(`Deleting Kubernetes Deployment "${state.metadata.name}"`)
  await kubeClient
    .deleteNamespacedDeployment(state.metadata.name, state.metadata.namespace, {}, 'false', 60)
    .catch((resp) => {
      context.log(resp.body.message)
      throw new Error(JSON.stringify(resp.body))
    })

  context.saveState({})
  return {}
}

const get = async (inputs, context) => {
  const { state } = context
  if (!state || !state.metadata || !state.metadata.name || !state.metadata.namespace) {
    return {}
  }

  const { body } = await kubeClient
    .readNamespacedDeployment(state.metadata.name, state.metadata.namespace)
    .catch((resp) => {
      context.log(resp.body.message)
      throw new Error(JSON.stringify(resp.body))
    })
  context.saveState(body || {})
  return body || {}
}

module.exports = {
  deploy,
  get,
  remove
}
