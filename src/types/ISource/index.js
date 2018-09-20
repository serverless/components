const ISource = {
  getSourceConfig() {
    return {
      uri: String
    }
  },

  // eslint-disable-next-line no-unused-vars
  async deploySource(subscription, context) {
    return undefined
  }
}

export default ISource
