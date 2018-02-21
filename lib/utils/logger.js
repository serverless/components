module.exports = (message) => {
  if (process.env.CLI) {
    process.stdin.write(`${message}\n`)
  }
}
