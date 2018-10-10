import { fileExists, readFile } from '@serverless/utils'
import path from 'path'
import raven from 'raven'
import { version } from '../../../package.json'

const errorReporter = async () => {
  const trackingConfigFilePath = path.join('..', '..', 'tracking-config.json')

  if (await fileExists(trackingConfigFilePath)) {
    const trackingConfig = await readFile(trackingConfigFilePath)

    const { sentryDSN, environment } = trackingConfig

    raven.config(sentryDSN, {
      environment,
      autoBreadcrumbs: true,
      release: version
    })
    raven.disableConsoleAlerts()
    raven.install()

    return raven
  }

  return null
}

export default errorReporter
