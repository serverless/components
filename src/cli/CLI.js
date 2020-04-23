/*
 * SERVERLESS COMPONENTS: CLI
 */

const os = require('os')
const chalk = require('chalk')
const ansiEscapes = require('ansi-escapes')
const stripAnsi = require('strip-ansi')
const figures = require('figures')
const prettyoutput = require('prettyoutput')
const { version } = require('../../package.json')

// CLI Colors
const grey = chalk.dim
const white = (str) => str // we wanna use the default terimanl color, so we just return the string as is with no color codes
const { green } = chalk
const red = chalk.rgb(255, 99, 99)
const blue = chalk.rgb(199, 232, 255)

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
    this._.statusColor = grey
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
  start(status, options = {}) {
    if (options.timer) {
      this._.timer = true
    } else {
      this._.timer = false
    }

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

    // Set default close handler, if one was not provided
    if (!options.closeHandler) {
      const self = this
      options.closeHandler = async () => {
        return self.close('close')
      }
    }

    // Set Event Handler: Control + C to cancel session
    process.on('SIGINT', options.closeHandler)

    if (status) {
      this.status(status)
    }

    // Start render engine
    return this._renderEngine()
  }

  /**
   * Close
   * - Closes the CLI process with relevant, clean information.
   */
  close(reason, message = 'Closed') {
    // Set color
    let color = white
    if (reason === 'error' || reason === 'cancel') {
      color = red
    }
    if (reason === 'close') {
      color = white
    }
    if (reason === 'success') {
      color = green
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.cursorLeft)
    process.stdout.write(ansiEscapes.eraseDown)

    // Write content
    this.log()
    let content = ''
    if (this._.timer) {
      content += `${this._.timerSeconds + 's'}`
      content += ` ${figures.pointerSmall} `
    }
    content += `${this._.entity} `
    content += `${figures.pointerSmall} ${message}`
    process.stdout.write(color(content))

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
  status(status = null, entity = null, statusColor = null) {
    this._.status = status || this._.status
    this._.entity = entity || this._.entity
    if (statusColor === 'green') {
      statusColor = green
    }
    if (statusColor === 'red') {
      statusColor = red
    }
    if (statusColor === 'blue') {
      statusColor = blue
    }
    if (statusColor === 'white') {
      statusColor = white
    }
    this._.statusColor = statusColor || grey
  }

  /**
   * Log
   * - Render log statements cleanly
   */
  log(msg, color = null) {
    if (!msg || msg == '') {
      console.log() // eslint-disable-line
      return
    }

    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)

    // Write log
    if (typeof msg === 'string') {
      msg = `${msg}\n`
      if (!color || color === 'white') {
        process.stdout.write(white(msg))
      }
      if (color === 'grey') {
        process.stdout.write(grey(msg))
      }
      if (color === 'red') {
        process.stdout.write(red(msg))
      }
      if (color === 'green') {
        process.stdout.write(green(msg))
      }
      if (color === 'blue') {
        process.stdout.write(blue(msg))
      }
    } else {
      console.log(msg)
    }

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)
  }

  logLogo(text) {
    let logo = os.EOL
    logo = logo + white(`serverless`)
    logo = logo + red(` ⚡ `)
    logo = logo + white(`framework`)

    if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
      logo = logo + grey(` (dev)`)
    }
    if (text) {
      logo = logo + text
    }
    this.log(logo)
  }

  logRegistryLogo(text) {
    let logo = os.EOL
    logo = logo + white(`serverless`)
    logo = logo + red(` ⚡ `)
    logo = logo + white(`registry`)

    if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
      logo = logo + grey(` (dev)`)
    }

    if (text) {
      logo = logo + text
    }
    this.log(logo)
  }

  logVersion() {
    this.logLogo()
    this.log()
    this.log(`       v${version}`)
    this.log()
  }

  advertise() {
    this.logLogo()
    let ad = grey(
      `This is a Serverless Framework Component.  Sign-in to use it for free with these features:`
    )
    ad = ad + os.EOL
    ad = ad + os.EOL + grey(`  • Registry Access`)
    ad = ad + os.EOL + grey(`  • Instant Deployments & Logs`)
    ad = ad + os.EOL + grey(`  • State Storage, Output Sharing & Secrets`)
    ad = ad + os.EOL + grey(`  • And Much More: https://serverless.com/components`)
    this.log(ad)
    this.close('error', 'Please log in by running "serverless login"', true)
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

      return this.close('error', `${error.message}`)
    }
    console.log() // eslint-disable-line
    console.log(``, red(error.stack)) // eslint-disable-line

    // Put cursor to starting position for next view
    process.stdout.write(ansiEscapes.cursorLeft)

    return this.close('error', `${error.message}`)
  }

  /**
   * Outputs
   * - Render outputs cleanly.
   */
  logOutputs(outputs) {
    if (!outputs || typeof outputs !== 'object' || Object.keys(outputs).length === 0) {
      this.close('done', 'Success')
    }
    // Clear any existing content
    process.stdout.write(ansiEscapes.eraseDown)
    process.stdout.write(
      white(
        prettyoutput(
          outputs,
          {
            colors: {
              keys: 'bold',
              dash: null,
              number: null,
              string: null,
              true: null,
              false: null
            }
          },
          0
        )
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
        content += `${this._.statusColor(this._.timerSeconds + 's')} `
        content += `${this._.statusColor(figures.pointerSmall)} `
      }
      content += `${this._.statusColor(this._.entity)} `
      content += `${this._.statusColor(figures.pointerSmall)} ${this._.statusColor(this._.status)}`
      content += ` ${this._.statusColor(this._.loadingDots)}`
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
