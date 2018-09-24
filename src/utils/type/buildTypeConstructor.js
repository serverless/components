import { forEachObjIndexed, isFunction, set, walkReduceDepthFirst } from '@serverless/utils'
import { SYMBOL_TYPE } from '../constants'
import isTypeConstruct from './isTypeConstruct'

// eslint-disable-next-line no-unused-vars
const resolveProps = (props, { self, inputs, context }) => {
  // TODO BRN
  return props
}

const constructTypes = async (props, context) =>
  walkReduceDepthFirst(
    async (accum, value, keys) => {
      let constructedProps = await accum
      if (isTypeConstruct(value)) {
        const { type, inputs } = value
        const Type = await context.loadType(type)
        const instance = await context.construct(Type, inputs)
        constructedProps = set(keys, instance, constructedProps)
      }
      return constructedProps
    },
    props,
    props
  )

const buildTypeConstructor = (type) => {
  const { main, props, parent, root } = type

  // construction process
  // 1) lowest level constructor needs to fire first, so we dive using super calls to get to the bottom immediately
  // 2) the constructor methods on classes are held in reference
  // 3) Properties for each layer are resolved before calling the constructor methods
  // 4) properties at the parent type level should be resolved before resolving child props

  const constructor = function(inputs, context, Type) {
    // NOTE BRN: We have to do the instantiation async since we need to load and convert { type, inputs } combos to instances. The types have to be loaded first in order to do that. Any js constructor and divert the constructor to return any instance it want by simply returning a value from the constructor. Here we return a promise instead of the instance and then have the promise return the instance after the async construction.
    return (async () => {
      // NOTE BRN: set the type onto the instance so that we can use it in cases of reflection. Also, we check if the type symbol has already been set so that the top most type constructor sets the type and is not overridden by lower level types.
      if (!this[SYMBOL_TYPE]) {
        this[SYMBOL_TYPE] = Type
      }

      // NOTE BRN: call parent constructors first so that we dive to the bottom of the class constructor heirarchy and build our instance from the bottom up, first resolving props on the base classes and layering the higher level class's props on top of the lower level ones. This allows for overriding the lower level props
      if (parent) {
        await parent.constructor.call(this, inputs, context)
      }

      // NOTE BRN: variables in inputs should already be resolved outside of the call to this constructor method. There should be no need to resolve them again here.

      // NOTE BRN: properties are first resolved since all the values in props are references to the execution context of the current type
      let resolvedProps = resolveProps(props, {
        self: this,
        inputs,
        context
      })

      // NOTE BRN: This step walks depth first through the properties and creates instances for any property that has both a 'type' and 'inputs' combo. Lower level instances are created first so in case we have nested constructions the higher construction will receive an instance as an input instead of the { type, inputs }
      resolvedProps = await constructTypes(resolvedProps, context)

      // NOTE BRN: We set all props onto the instance after they have been resolved.
      // QUESTION: Will this work if variables are referencing self?
      forEachObjIndexed((value, key) => {
        this[key] = value
      }, resolvedProps)

      if (main && isFunction(main.construct)) {
        main.construct.call(this, inputs, context)
      }

      // NOTE BRN: We return this because the constructor is overridden to return a Promise. Therefore the promise must return the reference to the instance.
      return this
    })()
  }

  constructor.prototype = new type.class()
  constructor.constructor = constructor // ¯\_(ツ)_/¯ That's javascript

  // NOTE BRN: This sets the js name for this constructor method. This will ensure that when this value is logged it will show up as '[name] {}'
  Object.defineProperty(constructor, 'name', { value: props.name })

  return constructor
}

export default buildTypeConstructor
