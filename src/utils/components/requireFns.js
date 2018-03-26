const requireFns = (componentRoot) => {
  let fns = {}
  try {
    fns = require(componentRoot) // eslint-disable-line global-require, import/no-dynamic-require
  } catch (error) {} // eslint-disable-line no-empty
  return fns
}

module.exports = requireFns
