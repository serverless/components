const { clone, is, isEmpty, dissoc } = require('ramda')
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

const run = async (args) => {
  handleSignalEvents()
  if (command === 'package') {
    return packageComponent(options)
  }
  const command = args._.join(' ')
  const options = dissoc('_', args)

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

    const removeByIndex = (array, index) => { // eslint-disable-line
      return array.filter((_, i) => { // eslint-disable-line
        return i !== index
      })
    }

    const availableCommands = Object.keys(serverlessFileComponents).reduce((acc, curr) => {
      const componentPath = curr.split(':')
      const key = removeByIndex(componentPath, 0).join(':')

      const comp = serverlessFileComponents[curr]
      if (comp.commands) {
        // Set root component '' as 'root'
        const finalKey = key || 'root'
        acc[finalKey] = {
          commands: comp.commands,
          rootPath: comp.rootPath
        }
      }
      return acc
    }, {})

    if (!command || command === 'help' || options.h || options.help) {
      console.log(`
 ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███╗   ██╗███████╗███╗   ██╗████████╗███████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗████╗  ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║██╔██╗ ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██║╚██╗██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ╚██████╔╝██║ ╚████║███████╗██║ ╚████║   ██║   ███████║
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝
                                                                                          `) // eslint-disable-line
      console.log(`${chalk.whiteBright.bold('Here are the current available commands:')}`)
      console.log()
      // Todo refactor programatic declaration of core commands
      const coreCommands = [ 'remove', 'deploy' ]
      coreCommands.forEach((k) => {
        const cmd = `${k}`
        console.log(` ${chalk.whiteBright(cmd)}`)
      })
      Object.keys(availableCommands).forEach((k) => {
        const cdata = availableCommands[k]
        if (!isEmpty(cdata.commands)) {
          Object.keys(cdata.commands).forEach((c) => {
            const cmd = `${k} ${c}`
            const cmdInfo = cdata.commands[c]
            console.log(` ${chalk.redBright(cmd)} - ${cmdInfo.description}`)
          })
        }
      })
      console.log()
      console.log(`Run a command like this "${chalk.whiteBright('component deploy')}"`)
    }

    const stateFileComponents = getComponentsFromStateFile(stateFile)

    // If core command
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
      await doCommand(command, options, availableCommands)
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

async function doCommand(cmd, options, availableCommands) {
  const parts = cmd.split(' ')
  /* singular "core" command */
  if (parts.length === 1) {
    // SOLO command
  }

  /* command targeting sub components */
  if (parts.length > 1) {
    const componentKey = parts[0]
    const currentCommand = parts[1]

    if (!availableCommands[componentKey]) {
      console.log(`No ${componentKey} component found`) // eslint-disable-line
      return false
    }
    const componentCommands = availableCommands[componentKey].commands
    const componentRootPath = availableCommands[componentKey].rootPath

    if (!componentCommands) {
      console.log(`No commands found for "${componentKey}" component`) // eslint-disable-line
      return false
    }

    if (!componentCommands[currentCommand]) {
      console.log(`No "${currentCommand}" command found for ${componentKey} component`)  // eslint-disable-line
      return false
    }

    /* Function or CLI command to run */
    const handler = componentCommands[currentCommand].handler

    if (!handler) {
      console.log(`No 'handler' found for "${componentKey}" component. Please specify a function to run or shell script to execute`)  // eslint-disable-line
      return false
    }

    // 1. if function, run function
    if (is(Function, handler)) {
      return handler('lol', 'foo', options)
    }

    // 2. if is shell script, run shell script
    if (hasWhiteSpace(handler)) {
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
      return functions[exportedFunction]('lol', 'foo', options)
    }

    // 4. Future, handle raw files or other runtime via stdin
  }
  return false
}

function hasWhiteSpace(s) {
  return s.indexOf(' ') >= 0
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
