function convertTimeout(timeout) {
  if (!isNaN(parseInt(timeout))) {
    return `${timeout}s`
  }
  throw new Error(`Timeout "${timeout}" is not an integer value`)
}

module.exports = convertTimeout
