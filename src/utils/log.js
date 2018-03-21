module.exports = (message) => {
  if (!process.env.CI) {
    try {
      process.stdin.write(`${message}\n`)
    } catch (error) {} // eslint-disable-line no-empty
  }
}
