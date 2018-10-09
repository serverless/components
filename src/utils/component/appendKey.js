import { append, join, split } from '@serverless/utils'

const appendKey = (key, keyPart) => join('.', append(keyPart, split('.', key)))

export default appendKey
