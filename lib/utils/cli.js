const os = require('os')
const readline = require('readline')

// isCLI - Checks if being used in interactive CLI mode
const isCLI = () => {
  if (process.env.CI && !process.env.CLI) return false
  else return true
}

// Log - A simple CLI logger
const log = (message) => {
  if (!isCLI) return
  process.stdin.write(`${message}\n`)
}

// Prompt - A simple CLI prompt utility
const prompt = async (prompt) => {
  return new Promise((resolve, reject) => {
    if (!isCLI) return resolve()

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(prompt + os.EOL, (answer) => {
      rl.close()
      return resolve(answer)
    })
  })
}

module.exports = {
  log: log,
  prompt: prompt
}
