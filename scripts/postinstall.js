const fs = require('fs')
const path = require('path')
const { join } = require('path')
const cp = require('child_process')
const os = require('os')

const { track } = require('../src/utils')

track('serverless-components Installed', {
  nodeVersion: process.version,
  platform: os.platform()
})

// get registry path
const registry = path.resolve(__dirname, path.join('..', 'registry'))

fs.readdirSync(registry).forEach((mod) => {
  const modPath = join(registry, mod)
  // ensure path has package.json
  if (!fs.existsSync(join(modPath, 'package.json'))) return

  // npm binary based on OS
  const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'

  // install folder
  const install = cp.spawn(npmCmd, [ 'i' ], { env: process.env, cwd: modPath })
  install.stdout.on('data', (data) => {
    console.log(data.toString()) // eslint-disable-line no-console
  })
})
