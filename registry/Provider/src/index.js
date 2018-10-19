const Provider = {
  getCredentials() {
    return this.credentials
  },

  getSdk() {
    throw new Error('Type extending Provider must implement getSdk method')
  }
}

export default Provider
