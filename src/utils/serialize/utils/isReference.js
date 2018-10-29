import { has } from '@serverless/utils'

const isReference = has('@@ref')

export default isReference
