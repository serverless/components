import { get, isObject, isString, set } from '@serverless/utils'
import errorTypeMainNotFound from './errorTypeMainNotFound'
import resolveTypeMain from './resolveTypeMain'
import requireTypeMain from './requireTypeMain'

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
  const cache = get('types.defs', context.cache)
  let typeDef = get([ root ], cache)
  if (typeDef) {
    return typeDef
  }

  typeDef = {
    root,
    props
  }

  if (!isString(typeDef.props.type) && typeDef.props.name !== 'Object') {
    typeDef = {
      ...typeDef,
      props: {
        ...typeDef.props,
        type: 'Object'
      }
    }
  }

  let parentTypeDef
  if (typeDef.props.type) {
    parentTypeDef = await context.loadType(typeDef.props.type)
  }

  // If parent type exists, then we need to extend the previous type
  // Else, define a new base level type

  // TODO BRN: Need to load type data from all layers of the type inheritance
  // Once each layer is loaded, when then need to merged the type data to form the new type

  let typeMain = resolveTypeMain(typeDef.props, typeDef.root)
  if (typeMain) {
    typeMain = requireTypeMain(typeMain)
  } else if (isString(typeDef.props.main)) {
    throw errorTypeMainNotFound(name, typeRoot)
  }

  // TODO BRN: Assemble the type class based on the main, meta and parent values

  console.log('parentTypeDef:', parentTypeDef)
  console.log('typeDef:', typeDef)
  console.log('typeMain:', typeMain)

  console.log(`loaded type ${typeDef.props.name} from ${typeDef.root}`)

  // store type meta data in cache
  context.cache = set('types.defs', set([typeDef.root], typeDef, cache), context.cache)

  return typeDef
}

export default defType
