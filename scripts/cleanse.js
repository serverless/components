/* eslint-disable no-console */
/* eslint-disable-next-line */
'use strict'

const fs = require('fs')
const { join, resolve } = require('path')
const cp = require('child_process')
const BbPromise = require('bluebird')

const registryPath = resolve(__dirname, join('..', 'registry'))
const componentDirs = fs.readdirSync(registryPath)

BbPromise.map(componentDirs, (componentDir) => {
  // eslint-disable-line consistent-return
  const componentDirPath = join(registryPath, componentDir)

  if (!fs.lstatSync(componentDirPath).isDirectory()) {
    return BbPromise.resolve()
  }

  const removeNodeModules = cp.spawn('rm', ['-rf', join(componentDirPath, 'node_modules')], {
    env: process.env
  })
  removeNodeModules.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  const removeDist = cp.spawn('rm', ['-rf', join(componentDirPath, 'dist')], {
    env: process.env
  })
  removeDist.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  const removeLock = cp.spawn('rm', [resolve(componentDirPath, 'package-lock.json')], {
    env: process.env
  })
  removeLock.stdout.on('data', (data) => {
    console.log(data.toString())
  })
}).then(() => {
  const removeRegistryNodeModules = cp.spawn('rm', ['-rf', resolve(registryPath, 'node_modules')], {
    env: process.env
  })
  removeRegistryNodeModules.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  const removeRegistryLock = cp.spawn('rm', [resolve(registryPath, 'package-lock.json')], {
    env: process.env
  })
  removeRegistryLock.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  const removeRootNodeModules = cp.spawn('rm', ['-rf', resolve(__dirname, '..', 'node_modules')], {
    env: process.env
  })
  removeRootNodeModules.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  const removeDist = cp.spawn('rm', ['-rf', resolve(__dirname, '..', 'dist')], {
    env: process.env
  })
  removeDist.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  const removeRootLock = cp.spawn('rm', [resolve(__dirname, '..', 'package-lock.json')], {
    env: process.env
  })
  removeRootLock.stdout.on('data', (data) => {
    console.log(data.toString())
  })
})
