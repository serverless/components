/*
 * SERVERLESS COMPONENTS: CLI
 */

const os = require('os')
const chalk = require('chalk')
const ansiEscapes = require('ansi-escapes')
const stripAnsi = require('strip-ansi')
const figures = require('figures')
const prettyoutput = require('prettyoutput')

// CLI Colors
const grey = chalk.dim
const green = chalk.rgb(0, 253, 88)
const red = chalk.rgb(255, 93, 93)

/**
 * Utility - Sleep
 */
const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

/**
 * CLI
 * - Controls the CLI experience in the framework.
 * - Once instantiated, it starts a single, long running process.
 */
class CLI {
  constructor(config) {
    // Defaults
    this._ = {}
    this._.entity = 'Serverless'
    this._.status = 'Initializing'
    this._.lastStatus = null
    this._.debug = config.debug || false
    this._.timer = config.timer || false
    this._.timerStarted = Date.now()
    this._.timerSeconds = 0
    this._.loadingDots = ''
    this._.loadingDotCount = 0
  }

  /**
   * Start
   * - Starts the CLI process
   */
  start() {
    // Hide cursor, to keep it clean
    process.stdout.write(ansiEscapes.cursorHide)

    if (this._.debug) {
      // Create a white space immediately
      this.log()
    }

    // Start counting seconds
    setInterval(() => {
      this._.timerSeconds = Math.floor((Date.now() - this._.timerStarted) / 1000)
    }, 1000)

    // Set Event Handler: Control + C to cancel session
    process.on('SIGINT', async () => {
      return this.close('cancel')
    })

    // Start render engine
    return this._renderEngine()
  }

  /**
   * Close
   * - Closes the CLI process with relevant, clean information.
   */
  close(reason, message) {
    if (reason === 'error') {
      message = red(message)
    }
    if (reason === 'cancel') {
      message = red('Canceled')
    }
    if (reason === 'done') {
      message = green(message || 'Done')
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.cursorLeft)
    process.stdout.write(ansiEscapes.eraseDown)

    // Write content
    this.log()
    let content = ''
    if (this._.timer) {
      content += `${grey(this._.timerSeconds + 's')}`
      content += ` ${grey(figures.pointerSmall)} `
    }
    content += `${this._.entity} `
    content += `${grey(figures.pointerSmall)} ${message}`
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

  /**
   * Debug Mode
   * - Is debug mode enabled
   */
  debugMode() {
    return this._.debug
  }

  /**
   * Status
   * - Update status in the CLI session
   * - Renders every 100ms
   */
  status(status, entity) {
    this._.status = status || this._.status
    this._.entity = entity || this._.entity
  }

  /**
   * Log
   * - Render log statements cleanly
   */
  log(msg, header) {
    if (!msg || msg == '') {
      console.log() // eslint-disable-line
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)

    // Write log
    if (typeof msg === 'string' && !msg.endsWith('\n')) {
      if (header) {
        header = `${header}\n`
        process.stdout.write(grey(header))
      }
      msg = `${msg}\n`
      process.stdout.write(msg) // eslint-disable-line
    } else {
      if (header) {
        header = `${header}\n`
        process.stdout.write(grey(header))
      }
      console.log(msg)
      console.log('')
    }

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  /**
   * Debug
   * - Render debug statements cleanly
   */
  debug(msg) {
    if (!this._.debug || !msg || msg == '') {
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)

    console.log(`${msg}`) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  /**
   * Error
   * - Render and error and close a long-running CLI process.
   */
  error(error, simple = false) {
    // If no argument, skip
    if (!error || error === '') {
      return
    }

    if (typeof error === 'string') {
      error = new Error(error)
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)

    // Render stack trace
    if (!this._.debug && simple) {
      // Put cursor to starting position for next view
      process.stdout.write(ansiEscapes.cursorLeft)

      return this.close('error', `Error: ${error.message}`)
    }
    console.log() // eslint-disable-line
    console.log(``, red(error.stack)) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)

    return this.close('error', `Error: ${error.message}`)
  }

  /**
   * Outputs
   * - Render outputs cleanly.
   */
  outputs(outputs) {
    if (!outputs || typeof outputs !== 'object' || Object.keys(outputs).length === 0) {
      this.close('done', 'Done')
    }
    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    console.log() // eslint-disable-line
    process.stdout.write(
      prettyoutput(
        outputs,
        {
          colors: {}
        },
        0
      )
    )
  }

  /**
   * Render Engine
   * Repetitively renders status and more on a regular interval
   */
  async _renderEngine() {
    /**
     * Debug Mode
     */
    if (this._.debug) {
      // Print Status
      if (this._.status !== this._.lastStatus) {
        this.log(this._.status + '...')
        this._.lastStatus = '' + this._.status
      }
    }

    /**
     * Non-Debug Mode
     */
    if (!this._.debug) {
      // Update active dots
      if (this._.loadingDotCount === 0) {
        this._.loadingDots = `.`
      } else if (this._.loadingDotCount === 2) {
        this._.loadingDots = `..`
      } else if (this._.loadingDotCount === 4) {
        this._.loadingDots = `...`
      } else if (this._.loadingDotCount === 6) {
        this._.loadingDots = ''
      }
      this._.loadingDotCount++
      if (this._.loadingDotCount > 8) {
        this._.loadingDotCount = 0
      }

      // Clear any existing content
      process.stdout.write(ansiEscapes.eraseDown)

      // Write status content
      console.log() // eslint-disable-line
      let content = ''
      if (this._.timer) {
        content += `${grey(this._.timerSeconds + 's')} `
        content += `${grey(figures.pointerSmall)} `
      }
      content += `${this._.entity} `
      content += `${grey(figures.pointerSmall)} ${grey(this._.status)}`
      content += ` ${grey(this._.loadingDots)}`
      process.stdout.write(content)
      console.log() // eslint-disable-line

      // Put cursor to starting position for next view
      const startingPosition = this._getRelativeVerticalCursorPosition(content)
      process.stdout.write(ansiEscapes.cursorUp(startingPosition))
      process.stdout.write(ansiEscapes.cursorLeft)
    }

    await sleep(100)
    return this._renderEngine()
  }

  /**
   * Get Relative Vertical Cursor Position
   * Get cursor starting position according to terminal & content width
   */
  _getRelativeVerticalCursorPosition(contentString) {
    const base = 1
    const terminalWidth = process.stdout.columns
    const contentWidth = stripAnsi(contentString).length
    const nudges = Math.ceil(Number(contentWidth) / Number(terminalWidth))
    return base + nudges
  }
}

module.exports = CLI
