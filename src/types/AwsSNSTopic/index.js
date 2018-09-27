const AwsSNSTopic = {
  async createSNSSubscription(context, { endpoint, protocol }) {
    const AwsSNSSubscription = await context.loadType('AwsSNSSubscription')
    const instance = context.construct(AwsSNSSubscription, {
      endpoint,
      protocol
    })
    await instance.deploy(context)
  },

  async deploySource(subscription) {
    const gateway = subscription.getGateway()
    const sink = subscription.getSink()
    let sinkConfig = sink.getSinkConfig()

    if (gateway) {
      sinkConfig = gateway.getSinkConfig()
    }

    if (sinkConfig.protocol === 'AwsLambdaFunction') {
      await this.createSNSSubscription({
        protocol: sinkConfig.protocol,
        endpoint: sinkConfig.uri
      })
    } else if (sinkConfig.protocol === 'HTTP') {
      await this.createSNSSubscription({
        protocol: sinkConfig.protocol,
        endpoint: sinkConfig.uri
      })
    }
  },

  getSinkConfig() {
    return {
      uri: this.arn,
      protocol: 'AwsSNSTopic'
    }
  }
}

export default AwsSNSTopic
