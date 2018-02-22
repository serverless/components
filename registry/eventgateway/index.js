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
    event,
    path: '/eslam/anything'
  }
  if (path && method) {
    params.path = `/eslam/${path}`
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

const create = async ({ id, arn, event, path, method }) => {
  await registerFunction({ id, arn })
  const res = await subscribe({ id, event, path, method })
  return {
    subscriptionId: res.subscriptionId,
    url: (event === 'http') ? `https://eslam.eventgateway-dev.io/${path}` : null
  }
}

const update = async ({ id, event, path, method, subscriptionId }) => {
  await await unsubscribe({ subscriptionId })
  const res = await subscribe({ id, event, path, method })
  return {
    subscriptionId: res.subscriptionId,
    url: (event === 'http') ? `https://eslam.eventgateway-dev.io/${path}` : null
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
  return {
    sampleEventGatewayOutput: 'eventgateway'
  }
  // let outputs
  // const isCreate = (!state.id || !state.arn)
  // const isRemove = (!inputs.id && !inputs.arn) && (state.id && state.arn)
  // const isRecreate = (state.id !== inputs.id || state.arn !== inputs.arn)
  //
  // if (isCreate) {
  //   console.log(`Creating Event Gateway Subscription: ${inputs.id}`)
  //   outputs = await create(inputs)
  // } else if (isRemove) {
  //   console.log(`Removing Event Gateway Subscription: ${state.id}`)
  //   outputs = await remove(state)
  // } else if (isRecreate) {
  //   console.log(`Removing Event Gateway Subscription: ${state.id}`)
  //   await remove(state)
  //   console.log(`Creating Event Gateway Subscription: ${inputs.id}`)
  //   outputs = await create(inputs)
  // } else {
  //   outputs = await update({ ...state, ...inputs })
  // }
  //
  // return outputs
}
