const path = require('path')
const chokidar = require('chokidar')
const run = require('./run')
const cli = require('./cli')

async function watch(config = {}) {
  let isProcessing = false
  let queuedOperation = false
  const directory = process.cwd()
  const displayName = path.basename(directory)

  // TODO: update this property later on with the services name
  const parentComponent = 'Awaiting changes'

  // Config CLI
  cli.config({
    stage: config.stage,
    parentComponent,
    useTimer: false
  })

  return new Promise((resolve, reject) => {
    const status = `Watching for changes in "${displayName}"`
    const watcher = chokidar.watch(directory, { ignored: /\.serverless/ })

    watcher.on('ready', () => {
      cli.status(status)
      cli.log('Press CTRL + C to stop watching...')
    })

    watcher.on('change', async () => {
      try {
        if (isProcessing && !queuedOperation) {
          queuedOperation = true
        } else if (!isProcessing) {
          // perform operation
          isProcessing = true
          await run(config, cli)
          cli.log('----------')
          // check if another operation is queued
          if (queuedOperation) {
            await run(config, cli)
            cli.log('----------')
          }
          // reset everything
          isProcessing = false
          queuedOperation = false
          cli.status(status)
          cli._.parentComponent = parentComponent // TODO: this hack should be refactored
        }
      } catch (error) {
        cli.error(error.message)
      }
    })

    watcher.on('error', (error) => {
      reject(error)
    })
  })
}

module.exports = watch
