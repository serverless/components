import {
  clone,
  defineProperty,
  forEach,
  get,
  isFunction,
  init,
  isString,
  keys,
  last,
  set,
  assign,
  walkReduceDepthFirst
} from '@serverless/utils'
import { SYMBOL_TYPE } from '../constants'
import hasVariableString from '../variable/hasVariableString'
import newVariable from '../variable/newVariable'
import isTypeConstruct from './isTypeConstruct'

const resolveProps = (props, data) =>
  walkReduceDepthFirst(
    (accum, value, pathParts) => {
      if (isString(value) && hasVariableString(value)) {
        const parentPathParts = init(pathParts)
        const lastPathPart = last(pathParts)
        const parent = get(parentPathParts, accum)
        // const parentCopy = clone(parent)
        // defineProperty(parent, pathPart, {
        //   configurable: true,
        //   enumerable: true,
        //   get() {
        //     const propPath = value.match(regex)[1]
        //     return value.replace(regex, get(propPath, data))
        //   },
        //   set(val) {
        //
        //     //TODO defineProperty
        //   }
        // })

        parent[lastPathPart] = newVariable(value, data)

        // return set(parentPathParts, parent, accum)
        return accum
      }
      return accum
    },
    props,
    props
  )

const constructTypes = async (props, ctx) => {
  const context = ctx.merge({ root: ctx.Type.root })
  return walkReduceDepthFirst(
    async (accum, value, pathParts) => {
      let constructedProps = await accum
      if (isTypeConstruct(value)) {
        const { type, inputs } = value
        const Type = await context.loadType(type)
        const instance = await context.construct(Type, inputs)
        constructedProps = set(pathParts, instance, constructedProps)
      }
      return constructedProps
    },
    props,
    props
  )
}

const buildTypeConstructor = (type) => {
  // construction process
  // 1) lowest level constructor needs to fire first, so we dive using super calls to get to the bottom immediately
  // 2) the constructor methods on classes are held in reference
  // 3) Properties for each layer are resolved before calling the constructor methods
  // 4) properties at the parent type level should be resolved before resolving child props

  const constructor = class extends type.class {
    constructor(inputs, context) {
      const { Type } = context
      const { main, props, parent } = Type

      // NOTE BRN: We have to do the instantiation async since we need to load and convert { type, inputs } combos to instances. The types have to be loaded first in order to do that. Any js constructor can divert the constructor to return any instance it wants by simply returning a value from the constructor. Here we return a promise instead of the instance and then have the promise return the instance after the async construction.
      return (async () => {
        // NOTE BRN: call super constructors first so that we dive to the bottom of the class constructor heirarchy and build our instance from the bottom up, first resolving props on the base classes and layering the higher level class's props on top of the lower level ones. This allows for overriding the lower level props.
        let self = await super(inputs, context.merge({ Type: parent }))

        // NOTE BRN: set the type onto the instance so that we can use it in cases of reflection.
        self[SYMBOL_TYPE] = Type

        // NOTE BRN: variables in inputs should already be resolved outside of the call to this constructor method. There should be no need to resolve them again here.

        // NOTE BRN: properties are first resolved since all the values in props are references to the execution context of the current type. We clone the properties here so that we don't change the base property descriptions from the Type.
        let resolvedProps = resolveProps(clone(props), {
          this: self,
          self,
          inputs,
          context
        })

        // NOTE BRN: This step walks depth first through the properties and creates instances for any property that has both a 'type' and 'inputs' combo. Lower level instances are created first so in case we have nested constructions the higher construction will receive an instance as an input instead of the { type, inputs }
        resolvedProps = await constructTypes(resolvedProps, context)

        // NOTE BRN: We set all props onto the instance after they have been resolved. We use the getOwnPropertyDescriptor and defineProperty so that we properly pass getters that may exist in the properties from the property resolution step
        self = Object.assign(self, resolvedProps)

        // NOTE BRN: If a construct method exists, call it now. This gives types one last chance to set values.
        if (main && isFunction(main.construct)) {
          await main.construct.call(self, inputs, context)
        }

        // NOTE BRN: We return self (this) because the constructor is overridden to return a Promise. Therefore the promise must return the reference to the instance.
        return self
      })()
    }
  }

  // NOTE BRN: This sets the js name for this constructor method. This will ensure that when this value is logged it will show up as '[name] {}'
  Object.defineProperty(constructor, 'name', { value: type.props.name })

  return constructor
}

export default buildTypeConstructor
