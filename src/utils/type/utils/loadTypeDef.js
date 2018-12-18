import { isString, omit, set, walkReduceDepthFirst } from '@serverless/utils'
import buildTypeClass from './buildTypeClass'
import buildTypeConstructor from './buildTypeConstructor'
import cacheTypeDef from './cacheTypeDef'
import errorReentrantTypeLoad from '../errors/errorReentrantTypeLoad'
import errorTypeMainNotFound from '../errors/errorTypeMainNotFound'
import isTypeConstruct from '../isTypeConstruct'
import requireTypeDef from './requireTypeDef'
import requireTypeMain from './requireTypeMain'
import resolveTypeMain from './resolveTypeMain'

const DEFAULT_MAIN = (SuperClass) => class extends SuperClass {}
const LOADING_TYPE_DEFS = new Set()

const doLoadTypeDef = async ({ root, props, query }, context) => {
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

  // NOTE BRN: In this step we scan the type's props for other types that need to be imported. We do this now so that they can be required and constructed synchronously later.
  await walkReduceDepthFirst(
    async (accum, value) => {
      // TODO BRN: Break this up into something that is pluggable by core so that anyone can introduce new interpretable values.
      if (isTypeConstruct(value)) {
        const { type } = value
        await context.import(type)
      }
    },
    null,
    omit(['inputTypes'], props)
  )

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

  LOADING_TYPE_DEFS.delete(root)
  return typeDef
}

const loadTypeDef = async (typeMeta, context) => {
  // NOTE BRN: check for type definition in cache. If found return the original instance so that we don't create duplicate type definitions
  const typeDef = requireTypeDef(typeMeta, context)
  if (typeDef) {
    return typeDef
  }

  // NOTE BRN: When loading a type. If a re-entrant call (circular reference) is made when loading a type, we throw an error. We could work on allowing the circular reference to be resolved by stopping the def process here and returning early, but for now it's not supported.
  if (LOADING_TYPE_DEFS.has(typeMeta.root)) {
    throw errorReentrantTypeLoad(typeMeta.props.name)
  }
  LOADING_TYPE_DEFS.add(typeMeta.root)

  // NOTE BRN: This bit of code might be confusing. We do NOT await the async function here so that any parallel calls to loadTypeDef are given the same Promise. This way the y resolve to the same eventual instance of the type instead of generating separate instances of the same type.
  const eventualTypeDef = doLoadTypeDef(typeMeta, context)

  cacheTypeDef(typeMeta, eventualTypeDef, context)
  return eventualTypeDef
}

export default loadTypeDef
