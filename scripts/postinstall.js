/* eslint-disable-next-line */
'use strict'

const path = require('path')
const os = require('os')

const rootPath = path.join(__dirname, '..')

function trackInstall() {
  try {
    const track = require(path.join(rootPath, 'dist', 'utils', 'telemetry', 'track')).default
    return track('serverless-components Installed', {
      nodeVersion: process.version,
      platform: os.platform()
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.log('WARN: error occurred durring install tracking - ', error)
    })
  } catch (error) {
    if (!error.message.includes('Cannot find module')) {
      // eslint-disable-next-line no-console
      console.log('WARN: error occurred durring install tracking - ', error)
    }
  }
}

trackInstall()
