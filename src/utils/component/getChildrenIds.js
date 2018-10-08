import { map, prop } from '@serverless/utils'

const getChildrenIds = (component) =>
  map((child) => child.id, prop('children', component))

export default getChildrenIds
