import { findPath, get, readFile, set } from '@serverless/utils'
import { dirname, isAbsolute, resolve } from 'path'
import errorTypeFileNotFound from './errorTypeFileNotFound'
import findTypeFileAtPath from './findTypeFileAtPath'

/**
 * @param {string} typePath the file path to look for a serverless config file
 * @param {*} context
 * @returns {{
 *   root: string,
 *   props: string
 * }}
 */
const loadTypeMetaFromPath = async (typePath, context) => {
  console.log('typePath:', typePath)
  let absoluteTypePath = typePath
  if (!isAbsolute(typePath)) {
    const basePath = findPath(context.root, context.cwd, process.cwd())
    absoluteTypePath = resolve(basePath, typePath)
  }

  // check for type meta in cache
  const metaCache = get('types.meta', context.cache)
  let typeMeta = get([absoluteTypePath], metaCache)
  if (typeMeta) {
    return typeMeta
  }

  // no type meta found, load file
  const typeFilePath = await findTypeFileAtPath(absoluteTypePath)
  if (!typeFilePath) {
    throw errorTypeFileNotFound(absoluteTypePath)
  }
  typeMeta = {
    root: dirname(typeFilePath),
    props: await readFile(typeFilePath)
  }

  // store type meta data in cache
  context.cache.types.meta = set([absoluteTypePath], typeMeta, metaCache)
  return typeMeta
}

export default loadTypeMetaFromPath
