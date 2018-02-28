const EventGateway = require('@serverless/event-gateway-sdk')

const getEventGatewayInstance = ({ space, eventGatewayApiKey }) => {
  if (process.env.EVENT_GATEWAY_API_KEY) {
    eventGatewayApiKey = process.env.EVENT_GATEWAY_API_KEY // eslint-disable-line no-param-reassign
  }

  return new EventGateway({
    url: 'https://eventgateway-dev.io',
    configurationUrl: 'https://config.eventgateway-dev.io',
    apikey: eventGatewayApiKey,
    space
  })
}

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

const getFunctionId = ({ lambdaArn }) => {
  const matchRes = lambdaArn.match(new RegExp('(.+):(.+):(.+):(.+):(.+):(.+):(.+)'))
  return matchRes ? matchRes[7] : ''
}

const getRegion = ({ lambdaArn }) => {
  const matchRes = lambdaArn.match(new RegExp('(.+):(.+):(.+):(.+):(.+):(.+):(.+)'))
  return matchRes ? matchRes[4] : ''
}

const registerFunction = async ({
  egInstance, functionId, lambdaArn, region
}) => {
  const credentials = getCredentials()
  return egInstance.registerFunction({
    functionId,
    provider: {
      type: 'awslambda',
      arn: lambdaArn,
      region,
      ...credentials
    }
  })
}

const deleteFunction = async ({ egInstance, functionId }) =>
  egInstance.deleteFunction({ functionId })

const subscribe = async ({
  egInstance, functionId, event, path, method, cors, space
}) => {
  let params = {
    functionId,
    event,
    path: `/${space}/${path}`
  }
  if (path && method) {
    params = {
      ...params,
      method
    }
  }
  if (cors) {
    params = {
      ...params,
      cors: {}
    }
  }
  return egInstance.subscribe(params)
}

const unsubscribe = async ({ egInstance, subscriptionId }) =>
  egInstance.unsubscribe({ subscriptionId })

const listSubscriptions = async ({ egInstance }) => egInstance.listSubscriptions()

const create = async ({
  egInstance,
  functionId,
  lambdaArn,
  event,
  path,
  method,
  cors,
  space,
  region
}) => {
  await registerFunction({
    egInstance,
    functionId,
    lambdaArn,
    region
  })
  const res = await subscribe({
    egInstance,
    functionId,
    event,
    path,
    method,
    cors,
    space
  })
  return {
    subscriptionId: res.subscriptionId,
    url: event === 'http' ? `https://${space}.eventgateway-dev.io/${path}` : null
  }
}

const update = async ({
  egInstance,
  functionId,
  event,
  path,
  method,
  cors,
  space,
  subscriptionId
}) => {
  await unsubscribe({ egInstance, subscriptionId })
  const res = await subscribe({
    egInstance,
    functionId,
    event,
    path,
    method,
    cors,
    space
  })
  return {
    subscriptionId: res.subscriptionId,
    url: event === 'http' ? `https://${space}.eventgateway-dev.io/${path}` : null
  }
}

const deploy = async (inputs, options, state, context) => {
  const region = getRegion(inputs)
  const functionId = getFunctionId(inputs)
  const egInstance = getEventGatewayInstance(inputs)

  inputs = {
    ...inputs,
    functionId,
    region,
    egInstance
  }

  const shouldCreate = !state.lambdaArn || !state.subscriptionId
  const shouldUpdate =
    state.event !== inputs.event ||
    state.path !== inputs.path ||
    state.method !== inputs.method ||
    state.cors !== inputs.cors

  let outputs = state
  if (shouldCreate) {
    context.log(`Creating Event Gateway Subscription: "${functionId}"`)
    outputs = await create(inputs)
  } else if (shouldUpdate) {
    context.log(`Updating Event Gateway Subscription: "${functionId}"`)
    outputs = await update({
      ...state,
      ...inputs
    })
  }
  return outputs
}

const remove = async (inputs, options, state, context) => {
  const region = getRegion(inputs)
  const functionId = getFunctionId(inputs)
  const egInstance = getEventGatewayInstance(inputs)

  inputs = {
    ...inputs,
    functionId,
    region,
    egInstance
  }

  const shouldRemove = state.subscriptionId

  let outputs = state
  if (shouldRemove) {
    context.log(`Removing Event Gateway Subscription: "${functionId}"`)
    await unsubscribe({ egInstance, subscriptionId: state.subscriptionId })
    await deleteFunction({ egInstance, functionId })
    outputs = {
      subscriptionId: null,
      url: null
    }
  }
  return outputs
}

const info = async (inputs, options, state, context) => {
  const egInstance = getEventGatewayInstance(inputs)

  context.log('Event Gateway setup:')
  if (Object.keys(state).length) {
    let res = await listSubscriptions({ egInstance })
    if (res.length) {
      // filter out the result we're looking for
      res = res
        .filter((entry) => {
          const pathWithoutSpace = entry.path.replace(`/${inputs.space}/`, '')
          const functionName = inputs.lambdaArn.split(':').pop()
          return (
            inputs.event === entry.event &&
            inputs.path === pathWithoutSpace &&
            functionName === entry.functionId
          )
        })
        .shift()
      // enhance the result with some information from the state
      const setup = {
        ...res,
        url: state.url
      }
      context.log(JSON.stringify(setup, null, 2))
    } else {
      context.log('Something went wrong...')
    }
  } else {
    context.log('Not deployed yet...')
  }
}

module.exports = {
  deploy,
  remove,
  info
}
