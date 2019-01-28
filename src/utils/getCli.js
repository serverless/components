const chalk = require('chalk')
const logUpdate = require('log-update')

// if id = "cli" -> activate status AND logging. (this is the top level instance constructed by the cli)
// if id is anything else -> activate only status (this instance is a child instance)
// if SERVERLESS_SILENT env var is set -> deactivate everything! status & logging
const getCli = (id) => {
  const cli = {
    status: (msg, color = 'yellow') =>
      logUpdate(`  ${chalk.gray('Status:')}  ${chalk[color](msg)}`),
    success: (msg) => cli.status(msg, 'green'),
    fail: (msg) => cli.status(msg, 'red'),
    log: (msg) => (id === 'cli' ? console.log(`   ${msg}`) : {}), // eslint-disable-line
    output: (name, value) => (id === 'cli' ? cli.log(`${chalk.grey(`${name}: `)}${value}`) : {})
  }
  if (process.env.SERVERLESS_SILENT) {
    return Object.keys(cli).reduce((accum, method) => {
      accum[method] = () => {} // silent all functions
    }, {})
  }

  return cli
}

module.exports = getCli
