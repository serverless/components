import path from 'path'

// TODO: move this into @serverless/utils ?!
import isTypeConstruct from '../../../dist/utils/type/isTypeConstruct'
import isComponent from '../../../dist/utils/component/isComponent'

import {
  append,
  map,
  or,
  isArray,
  reduce,
  resolve,
  resolvable,
  not,
  isString
} from '@serverless/utils'

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
  const Fn = await superContext.import('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      // construct function instances
      this.functions = await map(
        async (func, alias) =>
          context.construct(Fn, {
            ...func,
            functionName: resolvable(() => or(func.functionName, alias)),
            code: resolvable(() => resolveCodePath(resolve(func.code), this.getType().root))
          }),
        or(this.functions, {})
      )
      // construct component instances
      this.components = await map(async (component, key) => {
        if (isComponent(component)) {
          return component
        } else if (isTypeConstruct(component)) {
          // eslint-disable-next-line no-shadow
          const { type, inputs } = component
          const Type = await context.import(type)
          component = await context.construct(Type, inputs)
          if (!isComponent(component)) {
            throw new Error(
              `The component "${key}" is not of type Component (it's of type ${component.name})`
            )
          }
          return component
        }
        throw new Error(`The provided component definition ${JSON.stringify(component)} is invalid`)
      }, or(this.components, {}))
    }

    async define() {
      // TODO BRN: Change this once we support multiple layers here. This could cause collisions between functions and components that are named the same thing.
      return {
        ...or(this.functions, {}),
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
        type: 'Service',
        data: {},
        children: [...functions, ...components]
      }
    }
  }
}

export default Service
