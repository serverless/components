import { forEachObjIndexed, isFunction } from '@serverless/utils'

// eslint-disable-next-line no-unused-vars
const resolveProps = (props, instance, inputs, context) => {
  // TODO BRN
  return props
}

const buildTypeConstructor = (type) => {
  const { main, props, parent } = type

  // construction process
  // 1) lowest level constructor needs to fire first, so we dive using super calls
  // to get to the bottom immediately
  // 2) the constructor methods on classes are held in reference
  // 3) Properties for each layer are resolved before calling the constructor methods
  // 4) properties at the parent level should be resolved before resolving child props

  const constructor = function(inputs, context) {
    if (parent) {
      parent.constructor.call(this, inputs, context)
    }
    const resolvedProps = resolveProps(props, this, inputs, context)
    forEachObjIndexed((value, key) => {
      this[key] = value
    }, resolvedProps)
    if (main && isFunction(main.construct)) {
      main.construct.call(this, this, inputs, context)
    }
    return this
  }
  constructor.prototype = new type.class()
  constructor.constructor = constructor // ¯\_(ツ)_/¯ That's javascript
  Object.defineProperty(constructor, 'name', { value: props.name })
  return constructor
}

export default buildTypeConstructor
