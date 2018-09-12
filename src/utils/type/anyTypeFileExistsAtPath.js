import { any, fileExists, map } from '@serverless/utils'
import { join } from 'path'
import { TYPE_FILE_NAMES } from '../constants'

const anyTypeFileExistsAtPath = async (absoluteTypePath) => any(
  (typeFilePath) => fileExists(typeFilePath),
  map((typeFileName) => join(absoluteTypePath, typeFileName), TYPE_FILE_NAMES)
)

export default anyTypeFileExistsAtPath
