import { has } from '@serverless/utils'

const isComponent = (value) => has('instanceId', value)

export default isComponent
