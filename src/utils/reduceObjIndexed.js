const {
  curry, keys, prop, reduce
} = require('ramda')

const reduceObjIndexed = curry((reducer, accum, obj) => reduce(
  (acc, key) => reducer(acc, prop(key), key),
  accum,
  keys(obj)
))

module.exports = reduceObjIndexed
