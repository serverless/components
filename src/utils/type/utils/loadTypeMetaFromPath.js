import { has, readFile } from '@serverless/utils'
import { dirname, relative } from 'path'
import errorTypeFileNotFound from '../errors/errorTypeFileNotFound'
import findTypeFileAtPath from './findTypeFileAtPath'
import resolveTypePath from './resolveTypePath'

/**
 * @param {string} typePath the file path to look for a serverless config file
 * @param {*} context
 * @returns {{
 *   root: string,
 *   props: string
 * }}
 */
const loadTypeMetaFromPath = async (typePath, context) => {
  const absoluteTypePath = resolveTypePath(typePath, context)
  const typeFilePath = await findTypeFileAtPath(absoluteTypePath)
  if (!typeFilePath) {
    throw errorTypeFileNotFound(absoluteTypePath)
  }
  const typeProps = await readFile(typeFilePath)
  return {
    props: typeProps,

    // NOTE BRN: Not sure that this is right. We need a soure path that will be usable after this path is serialized. This means it could be loaded on another users machine and their machine would try to load from this path. Seems like being relative to the project might be the most predicatable way to find this file on a cross machine basis.
    query: has('project.path', context)
      ? relative(context.project.path, absoluteTypePath)
      : typePath,
    root: dirname(typeFilePath),
    name: typeProps.name
  }
}

export default loadTypeMetaFromPath
