import { map } from '@serverless/utils'
import Promise from 'bluebird'

const App = (SuperClass) =>
  class extends SuperClass {
    async define(context) {
      super.define(context)
      const Service = await context.loadType('Service')
      this.services = await Promise.props(
        map(async (service, ServiceName) => {
          return await context.construct(
            Service,
            {
              ...service,
              ServiceName
            },
            context
          )
        }, this.services)
      )
      const children = {
        ...this.services,
        // ...this.components
      }
      return children
    }
  }

export default App
