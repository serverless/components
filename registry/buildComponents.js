/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const fs = require('fs')
const { join } = require('path')
const os = require('os')
const cp = require('child_process')
const BbPromise = require('bluebird')
const { contains } = require('@serverless/utils')

const rootPath = __dirname
const dirsFilter = process.argv.slice(2)
const componentDirs = fs.readdirSync(rootPath).filter((componentDir) => {
  if (dirsFilter.length === 0) {
    return true
  }
  return contains(componentDir, dirsFilter)
})

function buildComponents(watch, concurrency) {
  return BbPromise.map(
    componentDirs,
    (componentDir) => {
      // eslint-disable-line consistent-return
      const componentDirPath = join(rootPath, componentDir)

      return new BbPromise((resolve, reject) => {
        if (!fs.existsSync(join(componentDirPath, 'package.json'))) {
          return resolve()
        }

        let babel = join(componentDirPath, '..', 'node_modules', '.bin')
        babel = os.platform().startsWith('win') ? join(babel, 'babel.cmd') : join(babel, 'babel')

        const params = [
          join(componentDir, 'src'),
          '--out-dir',
          join(componentDir, 'dist'),
          '--source-maps',
          '--copy-files',
          '--ignore',
          '**/node_modules',
          '--ignore',
          '**/*.test.js'
        ]

        if (watch === true) {
          params.unshift('--watch')
        }

        const command = cp.spawn(babel, params, { env: process.env, cwd: rootPath })
        command.stdout.on('data', (data) => {
          console.log(data.toString().replace(/\n/, ''))
        })
        command.stdout.on('close', () => resolve())
        command.stdout.on('end', () => resolve())
        command.stdout.on('error', (error) => reject(error))
      })
    },
    { concurrency }
  )
}

module.exports = buildComponents
