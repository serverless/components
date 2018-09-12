/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const path = require('path')
const os = require('os')
const cp = require('child_process')
const BbPromise = require('bluebird')

const rootPath = path.join(__dirname, '..')
const registryPath = path.join(rootPath, 'registry')
const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'

function build() {
  return new BbPromise((resolve, reject) => {
    const command = cp.spawn(npmCmd, ['run', 'build'], {
      env: process.env,
      cwd: rootPath
    })
    command.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    command.stdout.on('close', () => resolve())
    command.stdout.on('end', () => resolve())
    command.stdout.on('error', (error) => reject(error))
  })
}

function installRegistryDependencies() {
  return new BbPromise((resolve, reject) => {
    const command = cp.spawn(npmCmd, ['install'], {
      env: process.env,
      cwd: registryPath
    })
    command.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    command.stdout.on('close', () => resolve())
    command.stdout.on('end', () => resolve())
    command.stdout.on('error', (error) => reject(error))
  })
}

;(() => {
  return BbPromise.resolve()
    .then(build)
    .then(installRegistryDependencies)
})()
