import { isFunction, map, resolve, keys, reduce, merge, forEach } from '@serverless/utils'

const App = (SuperClass) =>
  class extends SuperClass {
    async define() {
      return {
        ...this.services,
        ...this.components
      }
    }

    async info(context) {
      const services = []
      const components = []
      await map(async (serv) => {
        let output = {}
        if (isFunction(serv.info)) {
          output = await serv.info(context)
        } else {
          output = reduce(
            (acc, current) => !serv[current] || merge(acc, { [current]: serv[current] }),
            {},
            keys(serv.inputTypes)
          )
        }
        services.push(output)
      }, this.services)

      await map(async (comp) => {
        let output = {}
        if (isFunction(comp.info)) {
          output = await comp.info(context)
        } else {
          output = {}
          forEach(
            (el) => {
              const val = resolve(comp[el])
              if (val) {
                output[el] = val
              }
            },
            ['name', 'license', 'version', 'inputs']
          )
        }
        components.push({ title: output.functionName, type: comp.name, data: output })
      }, this.components)

      return {
        title: this.name,
        type: this.extends,
        data: [...components, ...services]
      }
    }
  }

export default App
