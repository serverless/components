const fdk = require('@serverless/fdk')

const eventGateway = fdk.eventGateway({
  url: 'http://localhost', // NOTE irellevant for a config only call
  configurationUrl: 'https://config.eventgateway-dev.io'
})

const getCredentials = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env
  let credentials = {
    awsAccessKeyId: AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: AWS_SECRET_ACCESS_KEY
  }
  if (AWS_SESSION_TOKEN) {
    credentials = {
      ...credentials,
      awsSessionToken: AWS_SESSION_TOKEN
    }
  }
  return credentials
}

const registerFunction = async ({ id, arn }) => {
  const params = {
    functionId: id,
    provider: {
      type: 'awslambda',
      arn,
      region: 'us-east-1',
      ...getCredentials()
    }
  }
  return eventGateway.registerFunction(params)
}

const deleteFunction = async ({ id }) => {
  const params = {
    functionId: id
  }
  return eventGateway.deleteFunction(params)
}

const subscribe = async ({ id, event, path, method }) => {
  const params = {
    functionId: id,
    event
  }
  if (path && method) {
    params.path = path
    params.method = method
  }
  return eventGateway.subscribe(params)
}

const unsubscribe = async ({ subscriptionId }) => {
  const params = {
    subscriptionId
  }
  return eventGateway.unsubscribe(params)
}

const getUrl = (path) => {
  const namespace = path.split('/')[0]
  const tailedPath = path.split('/')[1]
  return `https://${namespace}.eventgateway-dev.io/${tailedPath}`
}

const create = async ({ id, arn, event, path, method }) => {
  await registerFunction({ id, arn })
  const res = await subscribe({ id, event, path, method })
  return {
    subscriptionId: res.subscriptionId,
    url: (event === 'http') ? getUrl(path) : null
  }
}

const update = async ({ id, event, path, method, subscriptionId }) => {
  await await unsubscribe({ subscriptionId })
  const res = await subscribe({ id, event, path, method })
  return {
    subscriptionId: res.subscriptionId,
    url: (event === 'http') ? getUrl(path) : null
  }
}

const remove = async ({ id, subscriptionId }) => {
  await deleteFunction({ id })
  await unsubscribe({ subscriptionId })
  return {
    subscriptionId: null,
    url: null
  }
}

module.exports = async (inputs, state) => {
  let outputs
  const isCreate = (!state.id || !state.arn)
  const isRemove = (!inputs.id && !inputs.arn) && (state.id && state.arn)
  const isRecreate = (state.id !== inputs.id || state.arn !== inputs.arn)

  if (isCreate) {
    outputs = await create(inputs)
  } else if (isRemove) {
    outputs = await remove(state)
  } else if (isRecreate) {
    await remove(state)
    outputs = await create(inputs)
  } else {
    outputs = await update({ ...state, ...inputs })
  }

  return outputs
}
