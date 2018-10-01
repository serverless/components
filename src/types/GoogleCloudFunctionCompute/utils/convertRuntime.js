function convertRuntime(runtime) {
  if (runtime === 'nodejs') {
    return 'nodejs6'
  }
  // TODO: add support for other runtimes
  throw new Error(`Unknown runtime value in compute "${runtime}"`)
}

module.exports = convertRuntime
