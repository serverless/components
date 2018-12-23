import { and, concat, get, join, lowerCase, keys, omit, or, pick, values } from '@serverless/utils'
import path from 'path'

const UTIL_METHODS = {
  and,
  concat,
  get,
  join,
  lowerCase,
  keys,
  omit,
  or,
  pick,
  values,

  // TODO BRN: Pull these from utils instead so that there's no difference between node versions and we don't run into difficult to diagnose bugs. Consistency is better!
  pathBasename: path.basename,
  pathDirname: path.dirname,
  pathExtname: path.extname,
  pathNormalize: path.pathNormalize,
  pathJoin: path.join,
  pathParse: path.parse,
  pathRelative: path.relative,
  pathResolve: path.resolve
}

UTIL_METHODS.KEYS = Object.keys(UTIL_METHODS)
UTIL_METHODS.VALUES = Object.values(UTIL_METHODS)

export default UTIL_METHODS
