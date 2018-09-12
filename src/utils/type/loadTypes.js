import Promise from 'bluebird'
import { map } from 'ramda'
import loadType from './loadType'

const loadTypes = async (typeQueries, context) =>
  Promise.props(map((query) => loadType(query, context), typeQueries))

export default loadTypes
