import { error } from '@serverless/utils'

const errorTypeFileNotFound = (dirname) =>
  error(`No 'serverless.yml' defintion found at path ${dirname}`, {})

export default errorTypeFileNotFound
