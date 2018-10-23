import { all, isFunction, mapObjIndexed, resolve } from '@serverless/utils'

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
      await all(
        mapObjIndexed(async (serv) => {
          let output = {}
          if (isFunction(serv.info)) {
            output = await serv.info(context)
          } else {
            output = Object.keys(serv.inputTypes).reduce(
              (prev, current) =>
                !serv[current] || Object.assign(prev, { [current]: serv[current] }),
              {}
            )
          }
          services.push(output)
        }, resolve(this.services))
      )

      await all(
        mapObjIndexed(async (comp) => {
          let output = {}
          if (isFunction(comp.info)) {
            output = await comp.info(context)
          } else {
            output = {}
            ;['name', 'license', 'version', 'inputs'].forEach((el) => {
              const val = resolve(comp[el])
              if (val) {
                output[el] = val
              }
            })
          }
          components.push({ title: output.functionName, type: comp.name, data: output })
        }, resolve(this.components))
      )

      return {
        title: this.name,
        type: this.extends,
        data: [...components, ...services]
      }
    }
  }

export default App
