const GoogleCloudFunction = {
  getSinkConfig() {
    return {
      uri: this.functionName,
      protocol: 'GoogleCloudFunction'
    }
  }
}

export default GoogleCloudFunction
