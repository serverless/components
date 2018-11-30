import { get, isObject, isString, set } from '@serverless/utils'
import buildTypeClass from './buildTypeClass'
import buildTypeConstructor from './buildTypeConstructor'
import errorReentrantTypeLoad from './errorReentrantTypeLoad'
import errorTypeMainNotFound from './errorTypeMainNotFound'
import resolveTypeMain from './resolveTypeMain'
import requireTypeMain from './requireTypeMain'

const DEFAULT_MAIN = (SuperClass) => class extends SuperClass {}
const LOADING_TYPES = new Set()

const loadDef = async ({ root, props, query }, context) => {
  // NOTE BRN: When loading a type. If a re-entrant call (circular reference) is made when loading a type, we throw an error. We could work on allowing the circular reference to be resolved by stopping the def process here and returning early, but for now it's not supported.
  if (LOADING_TYPES.has(root)) {
    throw errorReentrantTypeLoad(props.name)
  }
  LOADING_TYPES.add(root)

  let typeDef = {
    root,
    props,
    query
  }

  // NOTE BRN: If the type defintion's propeties do not have an `extends` property, default it to 'Object'
  if (!isString(typeDef.props.extends) && typeDef.props.name !== 'Object') {
    typeDef = set('props.extends', 'Object', typeDef)
  }

  let parentTypeDef
  if (typeDef.props.extends) {
    // NOTE BRN: Add the root to context so that files loaded by path are done so from this component's root
    context = context.merge({ root })

    // NOTE BRN: Load the parent type using the extends property. This can be any type reference supported by the `loadType` method.
    parentTypeDef = await context.import(typeDef.props.extends)
  }
  typeDef = set('parent', parentTypeDef, typeDef)

  // NOTE BRN: try to load the type main. This will default to './index.js'. When using the default, if we can't find the default then we ignore it. If the type was explicitly set in the serverless.yml file then we consider it an error when we can't find the main file.
  let typeMain = resolveTypeMain(typeDef.props, typeDef.root)
  if (typeMain) {
    typeMain = requireTypeMain(typeMain)
  } else if (isString(typeDef.props.main)) {
    throw errorTypeMainNotFound(typeDef.props.name, typeDef.root, typeDef.props.main)
  } else {
    typeMain = DEFAULT_MAIN
  }
  typeDef = set('main', typeMain, typeDef)

  // NOTE BRN: Build a class that holds the methods and base level constructors for the type definition. This class extends its parent so that `instanceof` checks will work since the parent classes are all part of the prototype chain.
  typeDef = set('class', await buildTypeClass(typeDef, context), typeDef)

  typeDef = set('constructor', buildTypeConstructor(typeDef), typeDef)

  LOADING_TYPES.delete(root)
  return typeDef
}

/**
 * Define a type using the given root path and property declarations
 *
 * @param {{ root: string, props: Object }} def The type definition
 * @param {Context} context The context object
 * @returns {Type}
 */
const defType = async ({ root, props, query }, context) => {
  if (!isObject(props)) {
    throw new Error('defType expects an object witha props property that is an object')
  }
  if (!isString(props.name)) {
    throw new Error(
      `Type declarations are expected to have a name. The type located at ${root} did not have one.`
    )
  }

  // NOTE BRN: check for type definition in cache. If found return the original instance so that we don't create duplicate type definitions
  const defsCache = get('types.defs', context.cache)
  let typeDef = get([root], defsCache)
  if (typeDef) {
    return typeDef
  }
  typeDef = loadDef({ root, props, query }, context)
  // NOTE BRN: store type def in cache to make sure
  context.cache.types.defs = set([root], typeDef, defsCache)

  return typeDef
}

export default defType
