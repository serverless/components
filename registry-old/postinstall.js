/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const fs = require('fs')
const join = require('path').join
const os = require('os')
const cp = require('child_process')
const BbPromise = require('bluebird')
const buildComponents = require('./buildComponents')

const rootPath = __dirname
const componentDirs = fs.readdirSync(rootPath)
const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'
const concurrency = 0

function installComponents() {
  return BbPromise.map(
    componentDirs,
    (componentDir) => {
      // eslint-disable-line consistent-return
      const componentDirPath = join(rootPath, componentDir)

      return new BbPromise((resolve, reject) => {
        if (!fs.existsSync(join(componentDirPath, 'package.json'))) {
          return resolve()
        }

        const command = cp.spawn(npmCmd, ['install'], { env: process.env, cwd: componentDirPath })
        command.stdout.on('data', (data) => {
          console.log(data.toString())
        })
        command.stdout.on('close', () => resolve())
        command.stdout.on('end', () => resolve())
        command.stdout.on('error', (error) => reject(error))
      })
    },
    { concurrency }
  )
}

;(() => {
  return BbPromise.resolve()
    .then(() => buildComponents(false, concurrency))
    .then(installComponents)
})()
