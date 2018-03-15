const tmp = require('tmp')
const fs = require('fs')
const path = require('path')
const mustache = require('mustache')
const recursive = require('recursive-readdir')

const deploy = (inputs) => {
  const values = inputs.values || {}
  const sourcePath = inputs.sourcePath || process.cwd()

  const tmpDir = tmp.dirSync()
  const tmpPath = tmpDir.name

  // copy non-template files
  recursive(sourcePath, (error, sources) => {
    sources.forEach((source) => {
      if (source.match(/\.mustache/i)) {
        const template = fs.readFileSync(source, { encoding: 'utf8' })
        const rendered = mustache.render(template, values)
        const destination = path.join(
          tmpPath,
          path.relative(sourcePath, source.replace(/\.mustache$/i, ''))
        )
        fs.writeFileSync(destination, rendered, {
          encoding: 'utf8'
        })
      } else {
        const destination = path.join(tmpPath, path.relative(sourcePath, source))
        fs.copyFileSync(source, destination)
      }
    })
  })

  return { renderedFilePath: tmpPath }
}

module.exports = { deploy }
