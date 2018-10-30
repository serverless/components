import { findPath, get, has, readFile, set } from '@serverless/utils'
import { dirname, isAbsolute, relative, resolve } from 'path'
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
  const typeProps = await readFile(typeFilePath)
  typeMeta = {
    props: typeProps,

    // NOTE BRN: Not sure that this is right. We need a soure path that will be usable after this path is serialized. This means it could be loaded on another users machine and their machine would try to load from this path. Seems like being relative to the project might be the most predicatable way to find this file on a cross machine basis.
    query: has('project.path', context)
      ? relative(context.project.path, absoluteTypePath)
      : typePath,
    root: dirname(typeFilePath),
    name: typeProps.name
  }

  // store type meta data in cache
  context.cache.types.meta = set([absoluteTypePath], typeMeta, metaCache)
  return typeMeta
}

export default loadTypeMetaFromPath
