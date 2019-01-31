const { join } = require('path')
const { mergeDeep, fileExists, append, reduce, forEach } = require('@serverless/utils')
const { titelize } = require('../../src/utils')
const Component = require('../Component/serverless')

const { parseYaml, parseJson, prepareComponents } = require('./utils')

const defaults = {
  path: process.cwd()
}

class Components extends Component {
  async default(inputs = {}) {
    const config = mergeDeep(defaults, inputs)

    const serverlessJsonFile = join(config.path, 'serverless.json')
    const serverlessYmlFile = join(config.path, 'serverless.yml')
    const serverlessYamlFile = join(config.path, 'serverless.yaml')

    let fileContent
    if (await fileExists(serverlessYmlFile)) {
      fileContent = await parseYaml(serverlessYmlFile)
    } else if (await fileExists(serverlessYamlFile)) {
      fileContent = await parseYaml(serverlessYamlFile)
    } else if (await fileExists(serverlessJsonFile)) {
      fileContent = await parseJson(serverlessJsonFile)
    } else {
      throw new Error(
        `No Serverless config file (serverless.yml, serverless.yaml or serverless.json) found in ${
          config.path
        }`
      )
    }

    const { components } = fileContent
    const preparedComponents = prepareComponents(components)

    const numComponents = Object.keys(preparedComponents).length

    this.cli.status(`${numComponents} Components Loaded`)

    // run `default` command in parallel for now...
    const outputs = await Promise.all(
      reduce(
        (accum, value, key) => {
          const { component, inputs, instance } = value // eslint-disable-line
          this.cli.status(`Running ${component} "${key}"`)
          const promise = instance.default(inputs)
          return append(promise, accum)
        },
        [],
        preparedComponents
      )
    )

    this.cli.success(`Successfully Ran ${numComponents} Components`)

    // TODO: update so that only the most important outputs are shown
    forEach((output) => {
      this.cli.log('')
      forEach((value, key) => {
        const name = titelize(key)
        this.cli.output(name, value)
      }, output)
    }, outputs)
  }
}

module.exports = Components
