import { error } from '@serverless/utils'

const errorReentrantTypeLoadError = (name) =>
  error(`Reentrant type detected trying to load "${name}".`)

export default errorReentrantTypeLoadError
