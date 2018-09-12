import { error } from '@serverless/utils'

const errorUnknownTypeName = (typeName) =>
  error(`The type name ${typeName} is unknown. You may need to load this type using a file path.`)

export default errorUnknownTypeName
