module.exports = (...params) => {
  if (!process.env.CI) {
    try {
      console.log(...params) //eslint-disable-line no-console
    } catch (error) {} // eslint-disable-line no-empty
  }
}
