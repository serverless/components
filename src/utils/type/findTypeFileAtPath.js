import { fileExists, find, map } from '@serverless/utils'
import { join } from 'path'
import { TYPE_FILE_NAMES } from '../constants'

const findTypeFileAtPath = async (absoluteTypePath) =>
  find(
    (typeFilePath) => fileExists(typeFilePath),
    map((typeFileName) => join(absoluteTypePath, typeFileName), TYPE_FILE_NAMES)
  )

export default findTypeFileAtPath
