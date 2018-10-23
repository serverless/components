const ServerlessEventGateway = {
  async registerFunction(context, { functionId, type }) {
    const EGFunction = await context.loadType('ServerlessEventGatewayFunction')
    const egFunction = context.construct(EGFunction, {
      functionId,
      type
    })
    return egFunction.deploy(context)
  },

  async createEventType(context, { name }) {
    const EGEventType = await context.loadType('ServerlessEventGatewayEventType')
    const egEventType = context.construct(EGEventType, {
      name
    })
    return egEventType.deploy(context)
  },

  async subscribe(context, { type, eventType, functionId }) {
    const EGSubscription = await context.loadType('ServerlessEventGatewaySubscription')
    const egSubscription = context.construct(EGSubscription, {
      type,
      eventType,
      functionId
    })
    return egSubscription.deploy(context)
  },

  async configureGateway(subscription) {
    const sink = subscription.getSink()
    const sinkConfig = sink.getConfig()

    const functionId = `${sinkConfig.uri.toLowerCase()}`
    const egEventType = { name: 'http.request' }
    let egFunc = { type: 'http', provider: { url: sinkConfig.uri }, functionId }
    const egSubscription = { type: 'sync', eventType: egEventType.name, functionId }

    if (sinkConfig.protocol === 'AWSLambdaFunction') {
      const provider = sink.provider
      egFunc = {
        ...egFunc,
        type: 'awslambda',
        provider: {
          arn: sinkConfig.uri,
          region: provider.region,
          awsAccessKeyId: provider.credentials.awsAccessKeyId,
          awsSecretAccessKey: provider.credentials.awsSecretAccessKey
        }
      }
    }

    await this.registerFunction(egFunc)
    await this.createEventType(egEventType)
    await this.subscribe(egSubscription)
  },

  getSourceConfig() {
    uri: this.url
  },

  getSinkConfig() {
    return {
      protocol: 'HTTP',
      uri: this.url
    }
  }
}

export default ServerlessEventGateway
