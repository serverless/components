import { get, isObject, isString, set } from '@serverless/utils'
import buildTypeClass from './buildTypeClass'
import buildTypeConstructor from './buildTypeConstructor'
import errorTypeMainNotFound from './errorTypeMainNotFound'
import resolveTypeMain from './resolveTypeMain'
import requireTypeMain from './requireTypeMain'

const DEFAULT_MAIN = (SuperClass) => class extends SuperClass {}

const defType = async ({ root, props }, context) => {
  if (!isObject(props)) {
    throw new Error('defType expects an object witha props property that is an object')
  }
  if (!isString(props.name)) {
    throw new Error(
      `Type declarations are expected to have a name. The type located at ${root} did not have one.`
    )
  }

  // check for type definition in cache
  const defsCache = get('types.defs', context.cache)
  let typeDef = get([root], defsCache)
  if (typeDef) {
    return typeDef
  }

  typeDef = {
    root,
    props
  }

  if (!isString(typeDef.props.extends) && typeDef.props.name !== 'Object') {
    typeDef = set('props.extends', 'Object', typeDef)
  }

  let parentTypeDef
  if (typeDef.props.extends) {
    // Add the root to context so that files loaded by path are done so from
    // this component's root
    context = context.merge({ root })
    parentTypeDef = await context.loadType(typeDef.props.extends)
  }
  typeDef = set('parent', parentTypeDef, typeDef)

  let typeMain = resolveTypeMain(typeDef.props, typeDef.root)
  if (typeMain) {
    typeMain = requireTypeMain(typeMain)
  } else if (isString(typeDef.props.main)) {
    throw errorTypeMainNotFound(typeDef.props.name, typeDef.root, typeDef.props.main)
  } else {
    typeMain = DEFAULT_MAIN
  }
  typeDef = set('main', typeMain, typeDef)
  typeDef = set('class', await buildTypeClass(typeDef, context), typeDef)
  typeDef = set('constructor', buildTypeConstructor(typeDef), typeDef)

  // store type def in cache
  context.cache.types.defs = set([typeDef.root], typeDef, defsCache)

  return typeDef
}

export default defType
