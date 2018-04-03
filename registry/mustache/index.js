const tmp = require('tmp')
const fs = require('fs-extra')
const path = require('path')
const mustache = require('mustache')
const recursive = require('recursive-readdir')

const deploy = async (inputs) => {
  const values = inputs.values || {}
  const sourcePath = inputs.sourcePath || process.cwd()

  const tmpDir = tmp.dirSync()
  const tmpPath = tmpDir.name

  // copy non-template files
  await recursive(sourcePath).then((sources) => {
    sources.forEach((source) => {
      const destination = path.join(
        tmpPath,
        path.relative(sourcePath, source.replace(/\.mustache$/i, ''))
      )

      // Ensure tmp directories exist
      fs.ensureDirSync(path.dirname(destination))

      if (source.match(/\.mustache/i)) {
        const template = fs.readFileSync(source, { encoding: 'utf8' })
        const rendered = mustache.render(template, values)
        fs.writeFileSync(destination, rendered, {
          encoding: 'utf8'
        })
      } else {
        fs.copyFileSync(source, destination)
      }
    })
  })

  return { renderedFilePath: tmpPath }
}

module.exports = { deploy }
