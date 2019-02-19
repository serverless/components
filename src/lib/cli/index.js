const os = require('os')
const chalk = require('chalk')
const ansiEscapes = require('ansi-escapes')
const figures = require('figures')
const sleep = require('../../utils/sleep')

// Defaults
let running = false
let frame = 0
let seconds = 0
let stage = false
let entity = false
let method = false
let message = 'Running'
let loadingCount = 0
let loadingDots = ''

// Event Handler: Control + C
process.on('SIGINT', async function() {
  running = false
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
  if (running && !view && !content) renderStatus()

  // Increment frame count & seconds
  frame++
  seconds = String(Math.floor(frame / 10) + 1)
}

/**
 * Is Active
 */

const isActive = () => {
  return running
}

/**
 * Start
 */

const start = (currentStage, currentEntity, currentMethod) => {

  // Start engine
  running = true

  // Hide cursor to keep it clean
  process.stdout.write(ansiEscapes.cursorHide)

  // Set metadata
  stage = currentStage
  entity = currentEntity
  method = currentMethod

  // Initial line break
  console.log()

  engine()
}

/**
 * Stop
 */

const stop = (reason, message) => {

  // Stop engine
  running = false

  if (reason === 'error') {
    stage = chalk.red(stage)
    message = chalk.red(message)
  }
  if (reason === 'cancel') {
    stage = chalk.red(stage)
    message = chalk.red('Canceled')
  }
  if (reason === 'done') {
    stage = chalk.cyan(stage)
    message = chalk.green('Done')
  }

  // Clear any existing content
  process.stdout.write(ansiEscapes.cursorLeft)
  process.stdout.write(ansiEscapes.eraseDown)
  console.log(os.EOL)

  // Write content
  content = `  ${chalk.grey(seconds + 's')}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${stage}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${entity}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${message}`
  process.stdout.write(content)

  // Put cursor to starting position for next view
  console.log(os.EOL, os.EOL)
  process.stdout.write(ansiEscapes.cursorLeft)
  process.stdout.write(ansiEscapes.cursorShow)

  if (reason === 'error') process.exit(1)
  else process.exit(0)
}

/**
 * Render Status
 * - Renders status view then puts cursor back to starting position.
 */

const renderStatus = async (status) => {

  // Set message
  if (status) message = status

  // Loading dots
  if (loadingCount === 0) {
    loadingDots = `.`
  } else if (loadingCount === 2) {
    loadingDots = `..`
  } else if (loadingCount === 4) {
    loadingDots = `...`
  } else if (loadingCount === 6) {
    loadingDots = ''
  }
  loadingCount++
  if (loadingCount > 8) loadingCount = 0

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)

  // Write content
  process.stdout.write(ansiEscapes.cursorDown(1))
  content = `  ${chalk.grey(seconds + 's')}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${chalk.cyan(stage)}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${entity}`
  content += ` ${chalk.grey(figures.pointerSmall)} ${chalk.grey(message)}`
  content += ` ${chalk.grey(loadingDots)}`
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
  console.log()

  // Write log
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
  console.log()

  // Write warning
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
  console.log()

  // Write Error
  if (entity) {
    entity = `${chalk.red(entity)} ${chalk.red(figures.pointerSmall)} ${chalk.red(`Error:`)}`
    console.log(`  ${entity}`)
  } else {
    console.log(`  ${chalk.red('Error:')}`)
  }
  console.log(` `, error)

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorLeft)
}

/**
 * Render Outputs
 */

const renderOutputs = async (outputs, entity) => {

  // If no argument, skip
  if (!outputs || outputs === {}) return

  // Clear any existing content
  process.stdout.write(ansiEscapes.eraseDown)
  console.log()

  // Write Outputs
  if (entity) {
    entity = `${chalk.green(entity)} ${chalk.green(figures.pointerSmall)} ${chalk.green(`Outputs:`)}`
    console.log(`  ${entity}`)
  } else {
    console.log(`  ${chalk.green('Outputs:')}`)
  }
  for (const output in outputs) {
    console.log(`  ${chalk.grey(output + ':')} `, outputs[output])
  }

  // Put cursor to starting position for next view
  process.stdout.write(ansiEscapes.cursorLeft)
}

module.exports = {
  isActive,
  start,
  stop,
  renderStatus,
  renderLog,
  renderWarning,
  renderError,
  renderOutputs,
}


// Run this script alone to see a demo of the CLI
//
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
