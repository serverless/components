const YAML = require('js-yaml')

module.exports = (filePath, contents) => {
  if (filePath.endsWith('.json')) {
    return JSON.parse(contents)
  } else if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
    return YAML.load(contents.toString(), { filename: filePath })
  } else if (filePath.endsWith('.slsignore')) {
    return contents.toString().split('\n')
  }
  return contents.toString().trim()
}
