import { findPath } from '@serverless/utils'
import { isAbsolute, resolve } from 'path'

const resolveTypePath = (typePath, context) => {
  let absoluteTypePath = typePath
  if (!isAbsolute(typePath)) {
    const basePath = findPath(context.root, context.cwd, process.cwd())
    absoluteTypePath = resolve(basePath, typePath)
  }
  return absoluteTypePath
}

export default resolveTypePath
