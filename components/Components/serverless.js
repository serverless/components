const { mergeDeep, append, reduce } = require('@serverless/utils')
const Component = require('../Component/serverless')

const { loadServerlessFile, resolveVariables, prepareComponents, logOutputs } = require('./utils')

const defaults = {
  path: process.cwd()
}

class Components extends Component {
  async default(inputs = {}) {
    const config = mergeDeep(defaults, inputs)

    let fileContent
    fileContent = await loadServerlessFile(config.path)
    fileContent = resolveVariables(fileContent)
    const preparedComponents = prepareComponents(fileContent.components)

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

    logOutputs(this.cli, outputs)
  }

  async remove(inputs = {}) {
    const config = mergeDeep(defaults, inputs)

    let fileContent
    fileContent = await loadServerlessFile(config.path)
    fileContent = resolveVariables(fileContent)
    const preparedComponents = prepareComponents(fileContent.components)

    const numComponents = Object.keys(preparedComponents).length

    this.cli.status(`${numComponents} Components Loaded`)

    // run `remove` command in parallel for now...
    const outputs = await Promise.all(
      reduce(
        (accum, value, key) => {
          const { component, inputs, instance } = value // eslint-disable-line
          this.cli.status(`Running ${component} "${key}"`)
          const promise = instance.remove(inputs)
          return append(promise, accum)
        },
        [],
        preparedComponents
      )
    )

    this.cli.success(`Successfully Ran ${numComponents} Components`)

    logOutputs(this.cli, outputs)
  }
}

module.exports = Components
