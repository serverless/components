/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const path = require('path')
const os = require('os')
const BbPromise = require('bluebird')

const rootPath = path.join(__dirname, '..')

function trackInstall() {
  const track = require(path.join(rootPath, 'dist', 'utils', 'telemetry', 'track'))
  track('serverless-components Installed', {
    nodeVersion: process.version,
    platform: os.platform()
  })
}

;(() => {
  return BbPromise.resolve().then(trackInstall)
})()
