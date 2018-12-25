import { error } from '@serverless/utils'

const errorBadTypeQuery = (query) =>
  error(`
  Unrecognized type query format '${query}'.
  This was not a git url, url, semver type or file path that we recognized`)

export default errorBadTypeQuery
