/* eslint-disable */
'use strict'

const fs = require('fs')
const util = require('util')
const url = require('url')
const path = require('path')
const markdownMagic = require('markdown-magic')
const yaml = require('js-yaml')

const config = {
  transforms: {
    COMPONENT_HEADER(content, options, instance) {
      const dir = path.dirname(path.resolve(instance.originalPath))

      const name = formatComponentName(path.basename(dir))
      // capitalize AWS
      const formattedName = name.replace(/Aws|Iam/g, (l) => {
        return l.toUpperCase()
      })

      let description = ''
      const json = getYamlConfig(instance)
      if (json && json.description) {
        description = `\n\n${json.description}`
      }

      return `# ${formattedName}${description}`
    },
    COMPONENT_INPUT_TYPES(content, options, instance) {
      const json = getYamlConfig(instance)
      if (!json) {
        return content
      }
      const types = json.inputTypes
      let md = '## Input Types\n'
      md += '| Name | Type | Description |\n'
      md += '|:------ |:-----|:-----------------|\n'
      // loop over properties
      Object.keys(types)
        .sort((a, b) => {
          // sort optional fields to the end of table
          return types[a].required === types[b].required ? -1 : 1
        })
        .forEach((type) => {
          const info = types[type]
          const required = info.required ? '<br/>*required*' : ''
          const desc = info.description || info.displayName || type
          const cleanDesc = desc.replace(/(\r\n|\n|\r)/gm, '<br/>')
          md += `| **${type}**| \`${info.type}\`${required} | ${cleanDesc}\n`
        })

      return md
    },
    COMPONENT_OUTPUT_TYPES(content, options, instance) {
      const json = getYamlConfig(instance)
      if (!json) {
        return content
      }
      const types = json.outputTypes
      if (!types) {
        return content
      }
      let md = '## Output Types\n'
      md += '| Name | Type | Description |\n'
      md += '|:------ |:-----|:-----------------|\n'
      // loop over properties
      Object.keys(types)
        .sort((a, b) => {
          // sort optional fields to the end of table
          return types[a].required === types[b].required ? -1 : 1
        })
        .forEach((type) => {
          const info = types[type]
          const required = info.required ? '<br/>*required*' : ''
          const desc = info.description || info.displayName || type
          const cleanDesc = desc.replace(/(\r\n|\n|\r)/gm, '<br/>')
          md += `| **${type}**| \`${info.type}\`${required} | ${cleanDesc}\n`
        })

      return md
    },
    COMPONENT_EXAMPLES(content, options, instance) {
      const json = getYamlConfig(instance)
      if (!json) {
        return content
      }
      const logicalName = dashToCamel(`my-${json.type}`)
      let yml = {
        type: 'my-application',
        components: {
          [`${logicalName}`]: {
            type: json.type
          }
        }
      }

      const types = json.inputTypes
      let values = {}
      // loop over properties
      Object.keys(types)
        .sort((a, b) => {
          // sort optional fields to the end of table
          return types[a].required === types[b].required ? -1 : 1
        })
        .forEach((type) => {
          const info = types[type]
          if (info.example) {
            values[type] = info.example
          }
        })

      yml.components[logicalName].inputs = values
      let contents
      try {
        contents = yaml.safeDump(yml)
      } catch (error) {
        throw new Error(`error in example generation for ${JSON.stringify(json, null, 2)}`)
      }
      const header = '## Example\n'
      let ymlOutput = content
      if (contents && Object.keys(values).length) {
        ymlOutput = `${header}\`\`\`yml
${contents}
\`\`\``
      }
      return ymlOutput
    },
    COMPONENT_FOOTER(content, options, instance) {
      return content
    }
  }
}

markdownMagic(['README.md', 'registry/**/**.md'], config, () => {
  console.log('🎉 Docs updated!')
})

function getYamlConfig(instance) {
  const dir = path.dirname(path.resolve(instance.originalPath))
  const yamlPath = path.join(dir, 'serverless.yaml')
  const ymlPath = path.join(dir, 'serverless.yml')

  const yamlExists = fileExists(yamlPath)
  const ymlExists = fileExists(ymlPath)
  if (!yamlExists && !ymlExists) {
    // no yaml found return default
    return false
  }

  const finalPath = yamlExists ? yamlPath : ymlPath

  const json = parseYaml(finalPath)
  return json
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

function dashToCamel(str) {
  return str.replace(/\W+(.)/g, (x, chr) => {
    return chr.toUpperCase()
  })
}

function formatComponentName(string) {
  return toTitleCase(string.replace(/-/g, ' '))
}

function fileExists(filePath) {
  try {
    const stats = fs.statSync(filePath) // eslint-disable-line
    return true
  } catch (err) {
    return false
  }
}

function parseYaml(ymlPath) {
  try {
    return yaml.safeLoad(fs.readFileSync(ymlPath, 'utf8'))
  } catch (e) {
    return e
  }
}
