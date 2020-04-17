const { isEmpty, path } = require('ramda')
const { Graph, alg } = require('graphlib')
const traverse = require('traverse')
const { ServerlessSDK } = require('@serverless/platform-client')
const { getAccessKey, isLoggedIn, loadInstanceCredentials, getTemplate } = require('./utils')

const getOutputs = (allComponentsWithOutputs) => {
  const outputs = {}

  for (const instanceName in allComponentsWithOutputs) {
    outputs[instanceName] = allComponentsWithOutputs[instanceName].outputs
  }

  return outputs
}

const validateGraph = (graph) => {
  const isAcyclic = alg.isAcyclic(graph)
  if (!isAcyclic) {
    const cycles = alg.findCycles(graph)
    let msg = ['Your template has circular dependencies:']
    cycles.forEach((cycle, index) => {
      let fromAToB = cycle.join(' --> ')
      fromAToB = `${(index += 1)}. ${fromAToB}`
      const fromBToA = cycle.reverse().join(' <-- ')
      const padLength = fromAToB.length + 4
      msg.push(fromAToB.padStart(padLength))
      msg.push(fromBToA.padStart(padLength))
    }, cycles)
    msg = msg.join('\n')
    throw new Error(msg)
  }
}

const resolveTemplate = (template) => {
  const regex = /\${(\w*:?[\w\d.-]+)}/g
  let variableResolved = false
  const resolvedTemplate = traverse(template).forEach(function(value) {
    const matches = typeof value === 'string' ? value.match(regex) : null
    if (matches) {
      let newValue = value
      for (const match of matches) {
        const referencedPropertyPath = match.substring(2, match.length - 1).split('.')
        const referencedTopLevelProperty = referencedPropertyPath[0]
        if (/\${env:(\w*[\w.-_]+)}/g.test(match)) {
          newValue = process.env[referencedPropertyPath[1]]
          variableResolved = true
        } else {
          if (!template[referencedTopLevelProperty]) {
            throw Error(`invalid reference ${match}`)
          }

          if (!template[referencedTopLevelProperty].component) {
            variableResolved = true
            const referencedPropertyValue = path(referencedPropertyPath, template)

            if (referencedPropertyValue === undefined) {
              throw Error(`invalid reference ${match}`)
            }

            if (match === value) {
              newValue = referencedPropertyValue
            } else if (typeof referencedPropertyValue === 'string') {
              newValue = newValue.replace(match, referencedPropertyValue)
            } else {
              throw Error(`the referenced substring is not a string`)
            }
          }
        }
      }
      this.update(newValue)
    }
  })
  if (variableResolved) {
    return resolveTemplate(resolvedTemplate)
  }
  return resolvedTemplate
}

const getAllComponents = (template = {}) => {
  const { org, app, stage } = template
  // todo specify org, app, stage...etc
  const allComponents = {}

  for (const key in template) {
    if (template[key] && template[key].component) {
      allComponents[key] = {
        name: key,
        component: template[key].component,
        org,
        app,
        stage,
        inputs: template[key].inputs || {}
      }
    }
  }

  return allComponents
}

const setDependencies = (allComponents) => {
  const regex = /\${output:(\w*[\w.-_]+)}/g

  for (const instanceName in allComponents) {
    const dependencies = traverse(allComponents[instanceName].inputs).reduce(function(
      accum,
      value
    ) {
      const matches = typeof value === 'string' ? value.match(regex) : null
      if (matches) {
        for (const match of matches) {
          const splittedVariableString = match.substring(2, match.length - 1).split(':')
          const referencedInstanceString = splittedVariableString[splittedVariableString.length - 1]

          const referencedInstanceName = referencedInstanceString.split('.')[0]

          if (allComponents[referencedInstanceName] && !accum.includes(referencedInstanceName)) {
            accum.push(referencedInstanceName)
          }
        }
      }
      return accum
    },
    [])

    allComponents[instanceName].dependencies = dependencies
  }

  return allComponents
}

const createGraph = (allComponents, command) => {
  const graph = new Graph()

  for (const instanceName in allComponents) {
    graph.setNode(instanceName, allComponents[instanceName])
  }

  for (const instanceName in allComponents) {
    const { dependencies } = allComponents[instanceName]
    if (!isEmpty(dependencies)) {
      for (const dependency of dependencies) {
        if (command === 'remove') {
          graph.setEdge(dependency, instanceName)
        } else {
          graph.setEdge(instanceName, dependency)
        }
      }
    }
  }

  validateGraph(graph)

  return graph
}

const executeGraph = async (allComponents, graph, cli, sdk, credentials, options, command) => {
  const leaves = graph.sinks()

  if (isEmpty(leaves)) {
    return allComponents
  }

  const promises = []

  for (const instanceName of leaves) {
    const fn = async () => {
      const instanceYaml = allComponents[instanceName]

      if (command === 'remove') {
        const instance = await sdk.remove(instanceYaml, credentials, options)
        allComponents[instanceName].outputs = instance.outputs || {}
      } else {
        const instance = await sdk.deploy(instanceYaml, credentials, options)

        const outputs = {}
        outputs[instanceName] = instance.outputs

        if (!options.debug) {
          cli.log()
          cli.logOutputs(outputs)
        }

        allComponents[instanceName].outputs = instance.outputs || {}
      }
    }

    promises.push(fn())
  }

  await Promise.all(promises)

  for (const instanceName of leaves) {
    graph.removeNode(instanceName)
  }

  return executeGraph(allComponents, graph, cli, sdk, credentials, options, command)
}

module.exports = async (config, cli, command) => {
  cli.start('Initializing', { timer: true })
  // Get access key
  const accessKey = await getAccessKey()

  // Ensure the user is logged in or access key is available, or advertise
  if (!accessKey && !isLoggedIn()) {
    cli.advertise()
  }

  if (!config.debug) {
    cli.logLogo()
  } else {
    if (process.env.SERVERLESS_PLATFORM_STAGE === 'dev') {
      cli.log(`Running in Platform Dev stage`)
    }
  }

  const templateYaml = await getTemplate(process.cwd())

  if (!templateYaml) {
    throw new Error(`No components found in sub directories.`)
  }

  // Load Instance Credentials
  const credentials = await loadInstanceCredentials(templateYaml.stage)

  cli.status('Initializing', templateYaml.name)

  // initialize SDK
  const sdk = new ServerlessSDK({
    accessKey,
    context: {
      orgName: templateYaml.org
    }
  })

  // Prepare Options
  const options = {}
  options.debug = config.debug
  options.dev = config.dev

  // Connect to Serverless Platform Events, if in debug mode
  if (options.debug) {
    await sdk.connect({
      filter: {
        stageName: templateYaml.stage,
        appName: templateYaml.app
        // instanceName: templateYaml.name
      },
      onEvent: (evt) => {
        if (evt.event !== 'instance.run.logs') {
          return
        }
        if (evt.data.logs && Array.isArray(evt.data.logs)) {
          evt.data.logs.forEach((log) => {
            // Remove strange formatting that comes from stderr
            if (typeof log.data === 'string' && log.data.startsWith(`'`)) {
              log.data = log.data.substr(1)
            }
            if (typeof log.data === 'string' && log.data.endsWith(`'`)) {
              log.data = log.data.substring(0, log.data.length - 1)
            }
            if (typeof log.data === 'string' && log.data.endsWith(`\\n`)) {
              log.data = log.data.substring(0, log.data.length - 2)
            }
            cli.log(log.data)
          })
        }
      }
    })
  }

  if (command === 'remove') {
    cli.status('Removing', null, 'white')
  } else {
    cli.status('Deploying', null, 'white')
  }

  const allComponents = await getAllComponents(templateYaml)

  const allComponentsWithDependencies = setDependencies(allComponents)

  const graph = createGraph(allComponentsWithDependencies, command)

  const allComponentsWithOutputs = await executeGraph(
    allComponentsWithDependencies,
    graph,
    cli,
    sdk,
    credentials,
    options,
    command
  )

  if (command === 'remove') {
    cli.close('success', 'Success')
  } else {
    const outputs = getOutputs(allComponentsWithOutputs)

    if (options.debug) {
      cli.log()
      cli.logOutputs(outputs)
    }
  }

  cli.close('success', 'Success')
}
