const chalk = require('chalk')
const logUpdate = require('log-update')

// .log() and .output() are only enabled for the top level component when running via the CLI
const getCli = (enableLogs = false) => {
  const cli = {
    status: (msg, color = 'yellow') =>
      logUpdate(`  ${chalk.gray('Status:')}  ${chalk[color](msg)}`),
    success: (msg) => cli.status(msg, 'green'),
    fail: (msg) => cli.status(msg, 'red'),
    log: (msg) => (enableLogs ? console.log(`   ${msg}`) : {}), // eslint-disable-line
    output: (name, value) => (enableLogs ? cli.log(`${chalk.grey(`${name}: `)}${value}`) : {})
  }
  if (process.env.SERVERLESS_SILENT) {
    return Object.keys(cli).reduce((accum, method) => {
      accum[method] = () => {} // silent all functions
      return accum
    }, {})
  }

  return cli
}

module.exports = getCli
