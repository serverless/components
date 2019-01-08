module.exports.lambda = (e, ctx, cb) => {
  return cb(null, { foo: 'bar' })
}
