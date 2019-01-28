const chalk = require('chalk')
const logUpdate = require('log-update')

const getCli = (id) => {
  const cli = {
    status: (msg, color = 'yellow') =>
      logUpdate(`  ${chalk.gray('Status:')}  ${chalk[color](msg)}`),
    success: (msg) => cli.status(msg, 'green'),
    fail: (msg) => cli.status(msg, 'red'),
    log: (msg) => (id.includes('.') ? {} : console.log(`   ${msg}`)),
    output: (name, value) => (id.includes('.') ? {} : cli.log(`${chalk.grey(`${name}: `)}${value}`))
  }
  if (process.env.SERVERLESS_SILENT) {
    return Object.keys(cli).reduce((accum, method) => {
      accum[method] = () => {} // silent all functions
    }, {})
  }

  return cli
}

module.exports = getCli
