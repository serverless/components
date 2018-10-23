const Subscription = {
  getSource() {
    return this.source
  },

  getSink() {
    return this.sink
  },

  getGateway() {
    return this.gateway
  },

  getConfig() {
    return this.config
  },

  async deploy(context) {
    await this.source.deploySource(context)
  }
}

export default Subscription
