/* eslint no-console: 0 */
const { clone, is, isEmpty, difference  } = require('ramda')
const path = require('path')
const chalk = require('chalk')
const { execSync } = require('child_process')
const {
  errorReporter,
  getComponentsFromStateFile,
  getComponentsFromServerlessFile,
  getOrphanedComponents,
  // getExecutedComponents,
  buildGraph,
  executeGraph,
  setServiceId,
  readStateFile,
  writeStateFile,
  trackDeployment,
  handleSignalEvents,
  packageComponent
  // log
} = require('./utils')

const run = async (command, options) => {
  handleSignalEvents()
  if (command === 'package') {
    return packageComponent(options)
  }
  const reporter = await errorReporter()
  let components = {}
  let stateFile = {}
  let archive = {}
  try {
    stateFile = await readStateFile()
    stateFile = setServiceId(stateFile)
    // TODO BRN: If we're using immutable data, we shouldn't need to clone here
    archive = clone(stateFile)
    let componentsToUse
    let orphanedComponents
    const serverlessFileComponents = await getComponentsFromServerlessFile(stateFile)

    const rootComponentName = getRootComponentName(serverlessFileComponents)

    const availableCommands = Object.keys(serverlessFileComponents).reduce((acc, curr) => {
      const key = curr.replace(`${rootComponentName}:`, '')
      const comp = serverlessFileComponents[curr]
      if (comp.commands) {
        // Set root component key as 'root'
        const finalKey = (key === rootComponentName) ? 'root' : key
        acc[finalKey] = {
          commands: comp.commands,
          rootPath: comp.rootPath
        }
      }
      return acc
    }, {})

    // Show help if no command or help flag used without any component names
    if (!command || command === 'help' || (!command && options.h) || (!command && options.help)) {
      console.log(`
 ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███╗   ██╗███████╗███╗   ██╗████████╗███████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗████╗  ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝██║ ╚████║███████╗██║ ╚████║   ██║   ███████║
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
                                                                                          `) // eslint-disable-line
      // Todo refactor programatic declaration of core commands
      logAllCommandsHelp(availableCommands)
      return false
    }

    const stateFileComponents = getComponentsFromStateFile(stateFile)
    // console.log('stateFileComponents', stateFileComponents)
    // console.log('serverlessFileComponents', serverlessFileComponents)

    // If core command. Do it for everything
    // TODO refactor and run this elsewhere
    if (command === 'remove' || command === 'deploy') {
      if (command === 'remove') {
        componentsToUse = stateFileComponents
        orphanedComponents = {}
      } else {
        componentsToUse = serverlessFileComponents
        orphanedComponents = getOrphanedComponents(serverlessFileComponents, stateFileComponents)
      }
      components = { ...componentsToUse, ...orphanedComponents }
      if (command === 'deploy') {
        trackDeployment(componentsToUse)
      }
      const graph = await buildGraph(componentsToUse, orphanedComponents, command)
      await executeGraph(graph, components, stateFile, archive, command, options, false)
      // run the "info" command on every component after a successful deployment
      if (command === 'deploy') {
        // NOTE: need to re-build the graph here since we're mutating it in "executeGraph"
        // TODO: we should refactor this code later on
        // eslint-disable-next-line no-shadow
        const graph = await buildGraph(componentsToUse, orphanedComponents, 'info')
        await executeGraph(graph, components, stateFile, archive, 'info', options, false)
      }
    } else {
      // Do the CLI command from individual component
      await doCommand(command, options, availableCommands, {
        componentStateData: stateFileComponents,
        rootComponentName: rootComponentName
      })
    }
  } catch (error) {
    if (reporter) {
      reporter.captureException(error)
    }

    // DISABLING rollback for the launch.

    // log(chalk.red(`Error: ${error.message}. Rolling back...`))
    // const executedComponents = getExecutedComponents(components)
    // const executedComponentsGraph = await buildGraph(executedComponents, {}, command)
    // await executeGraph(
    //   executedComponentsGraph,
    //   executedComponents,
    //   stateFile,
    //   archive,
    //   command,
    //   options,
    //   true
    // )

    throw error
  } finally {
    await writeStateFile(stateFile)
  }
  return components
}

async function doCommand(cmd, options, availableCommands, data) {
  const parts = cmd.split(' ')

  const componentKey = parts[0]
  const commandData = availableCommands[componentKey]
  const currentCommand = parts[1]

  if (!commandData) {
    console.log(`No ${componentKey} component found`) // eslint-disable-line
    console.log() // eslint-disable-line
    logAllCommandsHelp(availableCommands)
    return false
  }

  /* singular "core" command */
  if (parts.length === 1) {
    // SOLO command
    if (!currentCommand || options.help || options.h) {
      console.log()
      const msg = `Here are the current available commands for ${componentKey}:`
      console.log(`${chalk.whiteBright.bold(msg)}`)
      console.log()
      logCommandHelp(componentKey, commandData.commands)
    }
  }

  /* command targeting sub components */
  if (parts.length > 1) {
    const componentName = (componentKey === 'root') ? data.rootComponentName : `${data.rootComponentName}:${componentKey}`

    const rootComponentInfo = {}
    // TODO cmds in root component have all state/inputs should we pass them into commands?
    const currentComponentData = data.componentStateData[componentName] || rootComponentInfo

    const currentComponentInputs = currentComponentData.inputs
    const currentComponentState = currentComponentData.state

    const componentCommands = commandData.commands
    const componentRootPath = commandData.rootPath

    if (!commandData.commands) {
      console.log(`No commands found for "${componentKey}" component`) // eslint-disable-line
      return false
    }

    /* Show help on "component name help", "component name --help" & "component name -h" */
    if (currentCommand === 'help' || (!currentCommand && options.help) || (!currentCommand && options.h)) {
      console.log()
      console.log(currentCommand)
      const msg = `Here are the current available commands for ${componentKey}:`
      console.log(`${chalk.whiteBright.bold(msg)}`)
      console.log()
      logCommandHelp(componentKey, commandData.commands)
      return false
    }

    if (!componentCommands[currentCommand]) {
      console.log(`No "${currentCommand}" command found for ${componentKey} component`)  // eslint-disable-line
      console.log() // eslint-disable-line
      logCommandHelp(componentKey, commandData.commands)
      return false
    }

    // validate options passed in
    const commandOptions = componentCommands[currentCommand].options
    if (commandOptions && !isEmpty(options)) {
      const optionsWithShortcuts = Object.keys(commandOptions).reduce((acc, curr) => {
        const cmdData = commandOptions[curr]
        if (cmdData.shortcut) {
          acc[cmdData.shortcut] = options[curr]
        }
        acc[curr] = options[curr]
        return acc
      }, {})
      // Diff the options + shortcut config with passed in options
      const unknownOptions = difference(Object.keys(options), Object.keys(optionsWithShortcuts))
      if (!isEmpty(unknownOptions)) {
        throw new Error(`Unknown option ${JSON.stringify(unknownOptions)}`)
      }
    }

    /* Function or CLI command to run */
    const handler = componentCommands[currentCommand].handler

    if (!handler) {
      console.log(`No 'handler' found for "${componentKey}" component. Please specify a function to run or shell script to execute`)  // eslint-disable-line
      return false
    }

    // 1. if function, run function
    if (is(Function, handler)) {
      return handler(currentComponentInputs, currentComponentState, options)
    }

    // 2. if is shell script, run shell script
    if (hasWhiteSpace(handler)) {
      // TODO pass in currentComponentInputs, currentComponentState, options?
      execSync(handler, { stdio: [ process.stdin, process.stdout, process.stderr ] })
      return false
    }

    // 3. if file path, get exported function and run it
    const fileParts = path.basename(handler).split('.')
    const fileName = fileParts[0]
    const exportedFunction = fileParts[1]
    const handlerPath = path.resolve(componentRootPath, fileName)
    const functions = exportedFunctions(handlerPath)
    if (functions && !functions[exportedFunction]) {
      console.log(`No ${handler} file export found in ${handlerPath} for ${componentKey} component`) // eslint-disable-line
      return false
    }

    if (functions && functions[exportedFunction] && is(Function, functions[exportedFunction])) {
      return functions[exportedFunction](currentComponentInputs, currentComponentState, options)
    }

    // 4. Future, handle raw files or other runtime via stdin
  }
  return false
}

/* pluck root component name */
function getRootComponentName(serverlessFileComponents) {
  const component = Object.keys(serverlessFileComponents)[0].split(':')
  return component[0]
}

function hasWhiteSpace(s) {
  return s.indexOf(' ') >= 0
}

function logAllCommandsHelp(availableCommands) {
  console.log(`${chalk.whiteBright.bold('Here are the current available commands:')}`)
  console.log()
  const coreCommands = [ 'remove', 'deploy' ]
  coreCommands.forEach((k) => {
    const cmd = `${k}`
    console.log(` ${chalk.whiteBright(cmd)}`)
  })
  Object.keys(availableCommands).forEach((k) => {
    const cdata = availableCommands[k]
    if (!isEmpty(cdata.commands)) {
      logCommandHelp(k, cdata.commands)
    }
  })
  console.log()
  console.log(`Run a command like this "${chalk.whiteBright('components deploy')}"`)
}

function logCommandHelp(componentKey, commands) {
  Object.keys(commands).forEach((c) => {
    const cmd = `${componentKey} ${c}`
    const cmdInfo = commands[c]
    console.log(` ${chalk.redBright(cmd)} - ${cmdInfo.description}`)
    // Todo log out options
  })
}

function exportedFunctions(filePath) {
  let fns = {}
  try {
    fns = require(filePath) // eslint-disable-line global-require, import/no-dynamic-require
  } catch (error) {
    throw error
  }
  return fns
}

module.exports = run
