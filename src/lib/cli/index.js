const os = require('os')
const chalk = require('chalk')
const ansiEscapes = require('ansi-escapes')
const figures = require('figures')
const sleep = require('../../utils/sleep')

// State
const state = {}
state.running = false
state.frame = 0
state.seconds = 0
state.stage = false
state.entity = false
state.method = false
state.message = 'Running'
state.loadingCount = 0
state.loadingDots = ''

// Event Handler: Control + C
process.on('SIGINT', async function() {
  state.running = false
  stop('cancel')
})

/**
 * Engine
 */

const engine = async () => {
  await render()
  await sleep(100)
  return engine()
}

/**
 * Render
 */

const render = async (view, content) => {

  // Render status view by default
  if (state.running && !view && !content) renderStatus()

  // Increment frame count & seconds
  state.frame++
  state.seconds = String(Math.floor(state.frame / 10) + 1)
}

/**
 * Start
 */

const start = (stage, entity, method) => {

  // Hide cursor to keep it clean
  process.stdout.write(ansiEscapes.cursorHide)

  // Set metadata
  state.stage = chalk.cyan(stage)
  state.entity = entity
  state.method = method

  // Start engine
  state.running = true
  engine()
}

/**
 * Stop
 */

const stop = (reason, message) => {

  // Stop engine
  state.running = false

  if (reason === 'error') message = chalk.red(message)
  if (reason === 'cancel') message = chalk.red('Canceled')
  if (reason === 'done') message = chalk.green('Done')

  // Clear any existing content
  process.stdout.write(ansiEscapes.cursorLeft)
  process.stdout.write(ansiEscapes.eraseDown)

  // Write content
  process.stdout.write(ansiEscapes.cursorDown(1))
  content = `  ${chalk.grey(state.seconds + 's')}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${state.stage}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${state.entity}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${message}`
  process.stdout.write(content)

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorDown(2))
  process.stdout.write(ansiEscapes.cursorLeft)
  process.stdout.write(ansiEscapes.cursorShow)
  process.exit(0)
}

/**
 * Render Status
 * - Renders status view then puts cursor back to starting position.
 */

const renderStatus = async (status) => {

  // Set message
  if (status) state.message = status

  // Loading dots
  if (state.loadingCount === 0) {
    state.loadingDots = `.`
  } else if (state.loadingCount === 2) {
    state.loadingDots = `..`
  } else if (state.loadingCount === 4) {
    state.loadingDots = `...`
  } else if (state.loadingCount === 6) {
    state.loadingDots = ''
  }
  state.loadingCount++
  if (state.loadingCount > 8) state.loadingCount = 0

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)

  // Write content
  process.stdout.write(ansiEscapes.cursorDown(1))
  content = `  ${chalk.grey(state.seconds + 's')}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${state.stage}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${state.entity}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${chalk.grey(state.message)}`
  content += ` ${chalk.grey(state.loadingDots)}`
  process.stdout.write(content)

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorUp(1))
  process.stdout.write(ansiEscapes.cursorLeft)
}

/**
 * Render Log
 */

const renderLog = async (log, entity) => {

  // If no argument, skip
  if (!log || log === '') return

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)

  // Write log
  process.stdout.write(ansiEscapes.cursorDown(1))
  if (entity) {
    entity = `${chalk.grey(entity)} ${chalk.grey(figures.pointerSmall)} ${chalk.grey(`Log:`)}`
    console.log(`  ${entity}`)
  }
  console.log(` `, log)

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorLeft)
}

/**
 * Render Warning
 */

const renderWarning = async (warning, entity) => {

  // If no argument, skip
  if (!warning || warning === '') return

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)

  // Write warning
  process.stdout.write(ansiEscapes.cursorDown(1))
  if (entity) {
    entity = `${chalk.yellow(entity)} ${chalk.yellow(figures.pointerSmall)} ${chalk.yellow(`Warning:`)}`
    console.log(`  ${entity}`)
  } else {
    console.log(` ${chalk.yellow('Warning:')}`)
  }
  console.log(` `, warning)

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorLeft)
}

/**
 * Render Error
 */

const renderError = async (error, entity) => {

  // If no argument, skip
  if (!error || error === '') return

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)

  // Write Error
  process.stdout.write(ansiEscapes.cursorDown(1))
  if (entity) {
    entity = `${chalk.red(entity)} ${chalk.red(figures.pointerSmall)} ${chalk.red(`Error:`)}`
    console.log(`  ${entity}`)
  } else {
    console.log(`  ${chalk.red('Error:')}`)
  }
  console.log(` `, error)

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorLeft)

  // If engine is not running, this is a one-off.  Add a line break to improve formatting.
  if (!state.running) process.stdout.write(ansiEscapes.cursorDown(1))
}

/**
 * Render Outputs
 */

const renderOutputs = async (outputs, entity) => {

  // If no argument, skip
  if (!outputs || outputs === {}) return

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)

  // Write Outputs
  process.stdout.write(ansiEscapes.cursorDown(1))
  if (entity) {
    entity = `${chalk.green(entity)} ${chalk.green(figures.pointerSmall)} ${chalk.green(`Outputs:`)}`
    console.log(`  ${entity}`)
  } else {
    console.log(`  ${chalk.green('Outputs:')}`)
  }
  for (const output in outputs) {
    console.log(`  ${chalk.grey(output + ':')} ${outputs[output]}`)
  }

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorLeft)
}

module.exports = {
  start,
  stop,
  renderStatus,
  renderLog,
  renderWarning,
  renderError,
  renderOutputs,
}



// start('dev', 'Website')
//
// setTimeout(() => {
//   renderLog('This is a log statement')
// }, 2000)
//
// setTimeout(() => {
//   renderLog('This is a log statement w/ an "entity" argument', 'AwsS3')
// }, 4000)
//
// setTimeout(() => {
//   renderLog({
//     hello: 'world',
//     foo: {
//       fizz: 'buzz',
//       foo: {
//         bar: 'one'
//       }
//     },
//     test1: 'result1', test2: 'result2'
//   }, 'AwsS3')
// }, 6000)
//
// setTimeout(() => {
//   renderWarning('You did not specify a region.  You should do this to ensure your website is deployed to the correct region.', 'AwsS3')
// }, 8000)
//
// setTimeout(() => {
//   let err = new Error('AWS S3 bucket limit exceeded.')
//   renderError(err, 'AwsS3')
// }, 10000)
//
// setTimeout(() => {
//   renderStatus('Recovering')
// }, 12000)
//
// setTimeout(() => {
//   renderStatus('Finishing')
// }, 12000)
//
// setTimeout(() => {
//   renderOutputs({ url: 'www.myapp.com' })
// }, 14000)
//
// setTimeout(() => {
//   renderOutputs({ url: 'www.myapp.com' }, 'AwsS3')
// }, 16000)
//
// setTimeout(() => {
//   stop('done')
// }, 18000)
