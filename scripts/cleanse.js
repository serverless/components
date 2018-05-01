const fs = require('fs')
const { join, resolve } = require('path')
const cp = require('child_process')

// get registry path
const registry = resolve(__dirname, join('..', 'registry'))

fs.readdirSync(registry).forEach((mod) => {
  const modPath = join(registry, mod)

  // ensure path has a node_modules folder
  if (fs.existsSync(join(modPath, 'node_modules'))) {
    const remove = cp.spawn('rm', [ '-rf', join(modPath, 'node_modules') ], { env: process.env })
    remove.stdout.on('data', (data) => {
      console.log(data.toString()) // eslint-disable-line no-console
    })
    const removeLock = cp.spawn('rm', [ resolve(modPath, 'package-lock.json') ], { env: process.env })
    removeLock.stdout.on('data', (data) => {
      console.log(data.toString()) // eslint-disable-line no-console
    })
  }
})

const remove = cp.spawn('rm', [ '-rf', resolve(__dirname, '..', 'node_modules') ], { env: process.env })
remove.stdout.on('data', (data) => {
  console.log(data.toString()) // eslint-disable-line no-console
})
const removeLock = cp.spawn('rm', [ resolve(__dirname, '..', 'package-lock.json') ], { env: process.env })
removeLock.stdout.on('data', (data) => {
  console.log(data.toString()) // eslint-disable-line no-console
})
