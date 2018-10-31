import path from 'path'
import { append, map, or, isArray, reduce, resolve, not, isString } from '@serverless/utils'

// temp solution...
const resolveCodePath = (code, root) => {
  if (isString(code) && not(path.isAbsolute(code))) {
    code = path.resolve(root, code)
  } else if (isArray(code)) {
    code = map((codeItem) => {
      if (isString(codeItem) && not(path.isAbsolute(codeItem))) {
        return path.resolve(root, codeItem)
      }
      return codeItem
    }, code)
  }
  return code
}

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.functions = await map(async (func, alias) => {
        return context.construct(Fn, {
          ...func,
          functionName: resolve(func.functionName) || alias,
          code: resolveCodePath(resolve(func.code), this.getType().root)
        })
      }, or(resolve(this.functions), {}))
    }

    async define() {
      // TODO BRN: Change this once we support multiple layers here. This could cause collisions between functions and components that are named the same thing.
      return {
        ...or(resolve(this.functions), {}),
        ...or(this.components, {})
      }
    }

    async info() {
      const functions = await reduce(
        async (accum, func) => append(await func.info(), accum),
        [],
        or(this.functions, {})
      )
      const components = await reduce(
        async (accum, component) => append(await component.info(), accum),
        [],
        or(this.components, {})
      )

      return {
        title: this.name,
        type: this.extends,
        data: {},
        children: [...functions, ...components]
      }
    }
  }
}

export default Service
