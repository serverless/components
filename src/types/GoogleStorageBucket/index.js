const GoogleStorageBucket = {
  async deploySource(subscription) {
    const sink = subscription.getSink()
    const config = subscription.getConfig()
    const sourceConfig = subscription.getSourceConfig()
    const sinkConfig = sink.getSinkConfig()

    if (sinkConfig.protocol === 'GoogleCloudFunction') {
      sink.httpsTrigger = null
      sink.eventTrigger = {
        resource: sourceConfig.uri,
        type: config.event
      }
      await sink.deploy()
    }
  },

  getSourceConfig() {
    return {
      uri: this.bucketName
    }
  }
}

export default GoogleStorageBucket
