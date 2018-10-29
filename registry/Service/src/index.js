import { forEach, isEmpty, isFunction, map, resolve } from '@serverless/utils'

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.functions = map(async (func, alias) =>
        context.construct(
          Fn,
          {
            ...func,
            functionName: func.functionName || alias
          },
          this.functions
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
      await map(async (func) => {
        let output = {}
        if (isFunction(func.info)) {
          output = await func.info(context)
          functions.push(output)
        } else {
          output = {}
          forEach(
            (el) => {
              const val = resolve(func[el])
              if (val) {
                output[el] = val
              }
            },
            [
              'code',
              'environment',
              'functionDescription',
              'functionName',
              'memory',
              'ufs',
              'timeout',
              'runtime',
              'tags'
            ]
          )
          if (!isEmpty(output)) {
            functions.push({ title: output.functionName, type: func.name, data: output })
          }
        }
      }, this.functions)

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
        data: [...functions, ...components]
      }
    }
  }
}

export default Service
