const { fileExists, readFile } = require('@serverless/utils')
const path = require('path')
const raven = require('raven')
const pkg = require('../../../package.json')

async function errorReporter() {
  const trackingConfigFilePath = path.join('..', '..', 'tracking-config.json')

  if (await fileExists(trackingConfigFilePath)) {
    const trackingConfig = await readFile(trackingConfigFilePath)

    const { sentryDSN, environment } = trackingConfig

    raven.config(sentryDSN, {
      environment,
      autoBreadcrumbs: true,
      release: pkg.version
    })
    raven.disableConsoleAlerts()
    raven.install()

    return raven
  }

  return null
}

module.exports = errorReporter
