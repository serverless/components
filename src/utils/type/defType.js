import { isObject, isString } from '@serverless/utils'
import errorTypeMainNotFound from './errorTypeMainNotFound'
import resolveTypeMain from './resolveTypeMain'
import requireTypeMain from './requireTypeMain'

const defType = async ({ root, type }, context) => {
  if (!isObject(type)) {
    throw new Error('defType expects an object witha type property that is an object')
  }
  if (!isString(type.name)) {
    throw new Error(
      `Type declarations are expected to have a name. The type located at ${root} did not have one.`
    )
  }

  // check for type definition in cache
  const cache = get('types.defs', context.cache)
  let typeDef = getProp(root, cache)
  if (typeDef) {
    return typeDef
  }

  typeDef = {
    root,
    type
  }

  if (!isString(typeDef.type.type) && typeDef.type.name !== 'Object') {
    typeDef = {
      ...typeDef,
      type: 'Object'
    }
  }

  let parentType
  if (finalType.type) {
    parentType = await context.loadType(typeDef.type.type)
  }

  // If parent type exists, then we need to extend the previous type
  // Else, define a new base level type

  // TODO BRN: Need to load type data from all layers of the type inheritance
  // Once each layer is loaded, when then need to merged the type data to form the new type

  let typeMain = resolveTypeMain(type, root)
  if (typeMain) {
    typeMain = requireTypeMain(typeMain)
  } else if (isString(type.main)) {
    throw errorTypeMainNotFound(name, typeRoot)
  }

  console.log('parentType:', parentType)
  console.log('finalType:', finalType)
  console.log('typeMain:', typeMain)

  console.log(`loaded type ${type.name} from ${root}`)

  // store type meta data in cache
  context.cache = set('types.loaded', assocProp(absoluteTypePath, typeMeta, cache), context.cache)

  return finalType
}

export default defType
