const chalk = require('chalk')
const ansiEscapes = require('ansi-escapes')
const figures = require('figures')
const sleep = require('./sleep')
const { isEmpty } = require('ramda')

const getCli = (componentName, parent = false) => {
  if (process.env.SERVERLESS_SILENT) {
    parent = false
  }
  let cli
  if (parent) {
    cli = {
      running: false,
      msg: chalk.yellow('Running'),
      outputs: {},
      status: (msg = 'Running') => {
        cli.msg = chalk.yellow(msg)
        if (cli.running) {
          return
        }

        // format writes
        process.stdout.write = (message) => {
          const newLine = message.endsWith('\n') ? '' : '\n'
          return cli.write(`${message + ansiEscapes.eraseDown + newLine}`)
        }

        // handle ctrl + c
        process.on('SIGINT', async function() {
          cli.stop()
          await sleep(100)
          process.exit(0)
        })

        // handle errors
        process.on('unhandledRejection', async function(error) {
          cli.error(error)
          await sleep(100)
          process.exit(1)
        })

        cli.running = true
        return cli.render()
      },
      stop: (msg = 'Stopped', color = 'red') => {
        cli.msg = chalk[color](msg)
        cli.running = false
      },
      done: (msg = 'Done') => cli.stop(msg, 'green'),
      error: (err) => {
        cli.log(`\n  ${err.stack}`)
        return cli.stop(err.message, 'red')
      },
      output: (label, value) => {
        if (isEmpty(cli.outputs)) {
          process.stdout.write('') // log space if first output
        }
        cli.outputs[label] = value
        process.stdout.write(`  ${chalk.grey(`${label}`)} ${value}\n`)
      },
      log: (msg) => {
        process.stdout.write(`  ${msg}\n`)
      },
      render: async (frame = 0) => {
        const nextFrame = ++frame
        const second = String(Math.floor(nextFrame / 10) + 1) // cause we're running at 10 frames per second
        cli.write(
          `${ansiEscapes.cursorLeft + ansiEscapes.eraseDown}\n  ${chalk.grey(
            `${second}s ${figures.pointerSmall}`
          )} ${componentName} ${chalk.grey(figures.pointerSmall)} ${chalk.yellow(
            cli.msg
          )}\n${ansiEscapes.cursorLeft + ansiEscapes.cursorUp(2)}`
        )
        if (!cli.running) {
          cli.write(`${ansiEscapes.cursorLeft + ansiEscapes.cursorDown(2)}\n`)
          return
        }
        await sleep(100)
        cli.render(nextFrame)
      },
      write: process.stdout.write.bind(process.stdout)
    }
  } else {
    cli = {
      outputs: {},
      status: () => {},
      stop: () => {},
      done: () => {},
      error: () => {},
      output: (label, value) => (cli.outputs[label] = value), // save child outputs in memory
      log: () => {},
      render: () => {},
      write: () => {}
    }
  }

  return cli
}

module.exports = getCli
