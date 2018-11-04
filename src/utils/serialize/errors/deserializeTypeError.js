import { error, toString } from '@serverless/utils'

const deserializeTypeError = ({ value, method, expected, reasons } = {}) =>
  error(`${method} expected a ${expected}. Instead was given ${toString(value)}`, {
    type: deserializeTypeError.TYPE,
    data: { value, method, expected },
    reasons
  })

deserializeTypeError.TYPE = 'DeserializeTypeError'

export default deserializeTypeError
