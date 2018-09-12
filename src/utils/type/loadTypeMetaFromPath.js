import { assocProp, get, getProp, has, readFile, set } from '@serverless/utils'
import { dirname, isAbsolute, resolve } from 'path'
import errorTypeFileNotFound from './errorTypeFileNotFound'
import findTypeFileAtPath from './findTypeFileAtPath'

/**
 * @param {string} typePath the file path to look for a serverless config file
 * @param {*} context
 * @returns {{
 *   root: string,
 *   type: string
 * }}
 */
const loadTypeMetaFromPath = async (typePath, context) => {
  let absoluteTypePath = typePath
  if (!isAbsolute(typePath)) {
    absoluteTypePath = resolve(context.cwd, typePath)
  }

  // check for type meta in cache
  const cache = get('types.meta', context.cache)
  let typeMeta = getProp(absoluteTypePath, cache)
  if (typeMeta) {
    return typeMeta
  }

  // no type meta found, load file
  const typeFilePath = await findTypeFileAtPath(absoluteTypePath)
  if (!typeFilePath) {
    throw errorTypeFileNotFound(dirname(typeFilePath))
  }
  typeMeta = {
    root: dirname(typeFilePath),
    type: await readFile(typeFilePath)
  }

  // store type meta data in cache
  context.cache = set(
    'types.meta',
    assocProp(absoluteTypePath, typeMeta, cache),
    context.cache
  )
  return typeMeta
}

export default loadTypeMetaFromPath
