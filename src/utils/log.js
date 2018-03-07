module.exports = (message) => {
  if (!process.env.CI) {
    process.stdin.write(`${message}\n`)
  }
}
