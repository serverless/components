module.exports = (message) => {
  if (!process.env.CI) {
    try {
      process.stdout.write(`${message}\n`)
    } catch (error) {} // eslint-disable-line no-empty
  }
}
