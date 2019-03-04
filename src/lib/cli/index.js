const os = require('os')
const util = require('util')
const chalk = require('chalk')
const ansiEscapes = require('ansi-escapes')
const stripAnsi = require('strip-ansi')
const figures = require('figures')
const sleep = require('../../utils/sleep')

class CLI {
  constructor() {
    // Defaults
    this._ = {}
    this._.stage = null
    this._.parentComponent = null
    this._.seconds = 0
    // Status defaults
    this._.status = {}
    this._.status.running = false
    this._.status.message = 'Running'
    this._.status.loadingDots = ''
    this._.status.loadingDotCount = 0
  }

  config(config) {
    this._.stage = config.stage
    this._.parentComponent = config.parentComponent
  }

  close(reason, message) {
    // Skip if not active
    process.stdout.write(ansiEscapes.cursorShow)
    if (!this.isStatusEngineActive()) {
      console.log() // eslint-disable-line
      process.exit(0)
      return
    }
    return this.statusEngineStop(reason, message)
  }

  getRelativeVerticalCursorPosition(contentString) {
    const base = 2
    const terminalWidth = process.stdout.columns
    const contentWidth = stripAnsi(contentString).length
    const nudges = Math.ceil(Number(contentWidth) / Number(terminalWidth))
    return base + nudges
  }

  async statusEngine() {
    this.renderStatusEngineStatement()
    await sleep(100)
    if (this.isStatusEngineActive()) {
      return this.statusEngine()
    }
  }

  isStatusEngineActive() {
    return this._.status.running
  }

  statusEngineStart() {
    this._.status.running = true
    // Start Status engine
    return this.statusEngine()
  }

  statusEngineStop(reason, message) {
    this._.status.running = false

    let stage
    if (reason === 'error') {
      stage = chalk.red(this._.stage)
      message = chalk.red(message)
    }
    if (reason === 'cancel') {
      stage = chalk.red(this._.stage)
      message = chalk.red('canceled')
    }
    if (reason === 'done') {
      stage = chalk.green(this._.stage)
      message = chalk.green('done')
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.cursorLeft)
    process.stdout.write(ansiEscapes.eraseDown)
    console.log(os.EOL) // eslint-disable-line

    // Write content
    let content = `  ${chalk.grey(this._.seconds + 's')}`
    content += ` ${chalk.grey(figures.pointerSmall)} ${stage}`
    content += ` ${chalk.grey(figures.pointerSmall)} ${this._.parentComponent}`
    content += ` ${chalk.grey(figures.pointerSmall)} ${message}`
    process.stdout.write(content)

    // Put cursor to starting position for next view
    console.log(os.EOL) // eslint-disable-line
    process.stdout.write(ansiEscapes.cursorLeft)
    process.stdout.write(ansiEscapes.cursorShow)

    if (reason === 'error') {
      process.exit(1)
    } else {
      process.exit(0)
    }
  }

  renderStatusEngineStatement(status) {
    // Start Status engine, if it isn't running yet
    if (!this.isStatusEngineActive()) {
      this.statusEngineStart()
    }

    // Set global status
    if (status) {
      this._.status.message = status
    }

    // Loading dots
    if (this._.status.loadingDotCount === 0) {
      this._.status.loadingDots = `.`
    } else if (this._.status.loadingDotCount === 2) {
      this._.status.loadingDots = `..`
    } else if (this._.status.loadingDotCount === 4) {
      this._.status.loadingDots = `...`
    } else if (this._.status.loadingDotCount === 6) {
      this._.status.loadingDots = ''
    }
    this._.status.loadingDotCount++
    if (this._.status.loadingDotCount > 8) {
      this._.status.loadingDotCount = 0
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)

    // Write content
    console.log(os.EOL) // eslint-disable-line
    let content = `  ${chalk.grey(this._.seconds + 's')}`
    content += ` ${chalk.grey(figures.pointerSmall)} ${chalk.green(this._.stage)}`
    content += ` ${chalk.grey(figures.pointerSmall)} ${this._.parentComponent}`
    content += ` ${chalk.grey(figures.pointerSmall)} ${chalk.grey(this._.status.message)}`
    content += ` ${chalk.grey(this._.status.loadingDots)}`
    process.stdout.write(content)
    console.log() // eslint-disable-line

    // Get cursor starting position according to terminal & content width
    const startingPosition = this.getRelativeVerticalCursorPosition(content)

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorUp(startingPosition))
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  renderStatusStatement(status, entity) {
    // If no arguments, skip
    if (!status || status == '') {
      return
    }
    if (!entity || entity == '') {
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    console.log() // eslint-disable-line

    // Write log
    entity = `${chalk.grey(this._.seconds + `s`)} ${chalk.grey(figures.pointerSmall)} ${chalk.grey(
      entity
    )} ${chalk.grey(figures.pointerSmall)} ${chalk.grey(`status:`)}`
    console.log(`  ${entity}`) // eslint-disable-line
    console.log(` `, status) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  renderStatus(verbose, status, entity) {
    if (!verbose) {
      return this.renderStatusEngineStatement(status)
    }
    return this.renderStatusStatement(status, entity)
  }

  renderLog(log, entity) {
    // If no argument, skip
    if (!log || log == '') {
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    console.log() // eslint-disable-line

    // Write log
    if (entity) {
      entity = `${chalk.grey(entity)} ${chalk.grey(figures.pointerSmall)} ${chalk.grey(`log:`)}`
      console.log(`  ${entity}`) // eslint-disable-line
    }
    console.log(` `, util.format(log, { colors: false })) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  renderWarning(warning, entity) {
    // If no argument, skip
    if (!warning || warning === '') {
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    console.log() // eslint-disable-line

    // Write warning
    if (entity) {
      entity = `${chalk.yellow(entity)} ${chalk.yellow(figures.pointerSmall)} ${chalk.yellow(
        `Warning:`
      )}`
      console.log(`  ${entity}`) // eslint-disable-line
    } else {
      console.log(` ${chalk.yellow('warning:')}`) // eslint-disable-line
    }
    console.log(` `, warning) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  renderError(error, entity) {
    // If no argument, skip
    if (!error || error === '') {
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    console.log() // eslint-disable-line

    // Write Error
    if (entity) {
      entity = `${chalk.red(entity)} ${chalk.red(figures.pointerSmall)} ${chalk.red(`error:`)}`
      console.log(`  ${entity}`) // eslint-disable-line
    } else {
      console.log(`  ${chalk.red('error:')}`) // eslint-disable-line
    }
    console.log(` `, error) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  renderOutputs(outputs, entity) {
    // If no argument, skip
    if (!outputs || !Object.keys(outputs).length) {
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    console.log() // eslint-disable-line

    // Write Outputs
    if (entity) {
      entity = `${chalk.green(entity)} ${chalk.green(figures.pointerSmall)} ${chalk.green(
        `outputs:`
      )}`
      console.log(`  ${entity}`) // eslint-disable-line
    } else {
      console.log(`  ${chalk.green('outputs:')}`) // eslint-disable-line
    }

    for (const output in outputs) {
      // If nested object, pretty-print at least one level to help readability
      if (!!outputs[output] && outputs[output].constructor === Object) {
        const nextOutputs = outputs[output]
        console.log(`  ${chalk.grey(output + ':')} `) // eslint-disable-line
        for (const nextOutput in nextOutputs) {
          // eslint-disable-next-line
          console.log(
            `    ${chalk.grey(nextOutput + ':')} `,
            util.inspect(nextOutputs[nextOutput], { colors: false })
          )
        }
      } else {
        // eslint-disable-next-line
        console.log(
          `  ${chalk.grey(output + ':')} `,
          util.inspect(outputs[output], { colors: false })
        )
      }
    }

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }
}

// Hide cursor always, to keep it clean
process.stdout.write(ansiEscapes.cursorHide)

// Create a single instance
const cli = new CLI()

// Count seconds
setInterval(() => {
  cli._.seconds++
}, 1000)

// Event Handler: Control + C
process.on('SIGINT', async function() {
  if (cli.isStatusEngineActive()) {
    return cli.statusEngineStop('cancel')
  }
  process.exit(1)
})

module.exports = cli
