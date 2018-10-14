import { map } from '@serverless/utils'
import Promise from 'bluebird'

const App = (SuperClass) =>
  class extends SuperClass {
    async define(context) {
      super.define(context)
      const children = {
        ...this.services
        // ...this.components
      }
      return children
    }
  }

export default App
