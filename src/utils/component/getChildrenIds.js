import { append, get, reduce } from '@serverless/utils'

const getChildrenIds = (component) =>
  reduce((accum, child) => append(get('instanceId', child), accum), [], get('children', component))

export default getChildrenIds
