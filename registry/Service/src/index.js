import { all, mapObjIndexed, resolve, isFunction, isEmpty } from '@serverless/utils'

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.functions = await all(
        mapObjIndexed(
          async (func, alias) =>
            context.construct(Fn, {
              ...func,
              functionName: func.functionName || alias
            }),
          resolve(this.functions)
        )
      )
    }

    async define() {
      // TODO BRN: Change this once we support multiple layers here. This could cause collisions between functions and components that are named the same thing.
      return {
        ...this.functions,
        ...this.components
      }
    }

    async info(context) {
      const functions = []
      const components = []
      await all(
        mapObjIndexed(async (func) => {
          let output = {}
          if (isFunction(func.info)) {
            output = await func.info(context)
            functions.push(output)
          } else {
            output = {}
            ;[
              'code',
              'environment',
              'functionDescription',
              'functionName',
              'memory',
              'ufs',
              'timeout',
              'runtime',
              'tags'
            ].forEach((el) => {
              const val = resolve(func[el])
              if (val) {
                output[el] = val
              }
            })
            if (!isEmpty(output)) {
              functions.push({ title: output.functionName, type: func.name, data: output })
            }
          }
        }, resolve(this.functions))
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
        data: [...functions, ...components]
      }
    }
  }
}

export default Service
