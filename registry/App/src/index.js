import { append, or, reduce } from '@serverless/utils'

const App = (SuperClass) =>
  class extends SuperClass {
    async define() {
      return {
        ...or(this.services, {}),
        ...or(this.components, {})
      }
    }

    async info() {
      const services = await reduce(
        async (accum, service) => append(await service.info(), accum),
        [],
        or(this.services, {})
      )
      const components = await reduce(
        async (accum, component) => append(await component.info(), accum),
        [],
        or(this.components, {})
      )

      return {
        title: this.name,
        type: this.name,
        data: {},
        children: [...components, ...services]
      }
    }
  }

export default App
