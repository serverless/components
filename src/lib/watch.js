const path = require('path')
const chokidar = require('chokidar')
const run = require('./run')
const cli = require('./cli')

async function watch(config = {}) {
  let isProcessing = false
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
        // immediately return if another operation is currently processed
        if (isProcessing) {
          return
        }
        // perform operation
        isProcessing = true
        await run(config, cli)
        // reset everything
        isProcessing = false
        cli.status(status)
        cli.log('----------')
        // TODO: this is a hack which should be refactored since it modifies private properties
        cli._.parentComponent = parentComponent
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
