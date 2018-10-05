import { map } from '@serverless/utils'
import Promise from 'bluebird'

const App = async (SuperClass, superContext) => {
  const Service = await superContext.loadType('Service')

  return {
    async define(context) {
      return Promise.props(
        map(async (service, name) => {
          return await context.construct(
            Service,
            {
              ...service,
              name
            },
            context
          )
        }, this.services)
      )
    }
  }
}

export default App
