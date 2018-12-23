import { all } from '@serverless/utils'

const Provider = {
  getCredentials() {
    return all(this.credentials)
  },

  getSdk() {
    throw new Error('Type extending Provider must implement getSdk method')
  }
}

export default Provider
