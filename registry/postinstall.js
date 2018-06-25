/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const fs = require('fs')
const join = require('path').join
const os = require('os')
const cp = require('child_process')
const BbPromise = require('bluebird')

const rootPath = __dirname
const componentDirs = fs.readdirSync(rootPath)
const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'
const concurrency = process.version.startsWith('v4') ? 8 : 0

function buildComponents() {
  return BbPromise.map(
    componentDirs,
    (componentDir) => {
      // eslint-disable-line consistent-return
      const componentDirPath = join(rootPath, componentDir)

      return new BbPromise((resolve, reject) => {
        if (!fs.existsSync(join(componentDirPath, 'package.json'))) return resolve()

        let babel = join(componentDirPath, '..', 'node_modules', '.bin')
        babel = os.platform().startsWith('win') ? join(babel, 'babel.cmd') : join(babel, 'babel')

        const command = cp.spawn(
          babel,
          [
            'src',
            '--out-dir',
            'dist',
            '--source-maps',
            '--copy-files',
            '--ignore',
            "'**/node_modules'",
            '--ignore',
            "'**/*.test.js'"
          ],
          { env: process.env, cwd: componentDirPath }
        )
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

function installComponents() {
  return BbPromise.map(
    componentDirs,
    (componentDir) => {
      // eslint-disable-line consistent-return
      const componentDirPath = join(rootPath, componentDir)

      return new BbPromise((resolve, reject) => {
        if (!fs.existsSync(join(componentDirPath, 'package.json'))) return resolve()

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
    .then(buildComponents)
    .then(installComponents)
})()
