const { resolve } = require('path')
const { prompt } = require('enquirer')
const WebSocket = require('ws')
const { chalk, sleep, fileExists } = require('../../src/utils')

const Lambda = require('../Lambda/serverless')
const WebSockets = require('../WebSockets/serverless')
const Component = require('../Component/serverless')

const isJson = (body) => {
  try {
    JSON.parse(body)
  } catch (e) {
    return false
  }
  return true
}

class Socket extends Component {
  async default(inputs = {}) {
    const socketFilePath = resolve(inputs.code || process.cwd(), 'socket.js')
    if (!(await fileExists(socketFilePath))) {
      this.cli.log('no socket.js file found in your codebase')
      return null
    }
    // make sure user does not overwrite the following
    inputs.runtime = 'nodejs8.10'
    inputs.handler = 'shim.socket'
    inputs.shim = resolve(__dirname, './shim.js')
    inputs.routeSelectionExpression = '$request.body.route'
    inputs.service = 'lambda.amazonaws.com'

    inputs.name = inputs.name || 'serverless'
    inputs.description = inputs.description || 'Serverless Socket'

    this.cli.status(`Deploying Socket`)

    const lambda = new Lambda(`${this.id}.lambda`)
    const lambdaOutputs = await lambda(inputs)

    inputs.routes = {
      $connect: lambdaOutputs.arn,
      $disconnect: lambdaOutputs.arn,
      $default: lambdaOutputs.arn
    }

    const websockets = new WebSockets(`${this.id}.websockets`)
    const websocketsOutputs = await websockets(inputs)

    this.state.url = websocketsOutputs.url
    this.state.socketFilePath = socketFilePath
    this.save()

    this.cli.success(`Socket Deployed`)
    this.cli.output('URL', `    ${websocketsOutputs.url}`)

    return { lambda: lambdaOutputs, websockets: websocketsOutputs }
  }

  async remove() {
    this.cli.status(`Removing Socket`)

    const lambda = new Lambda(`${this.id}.lambda`)
    const websockets = new WebSockets(`${this.id}.websockets`)

    const lambdaOutputs = await lambda.remove()
    const websocketsOutputs = await websockets.remove()

    this.state = {}
    this.save()

    this.cli.success(`Socket Removed`)

    return { lambda: lambdaOutputs, websockets: websocketsOutputs }
  }

  /*    /\
   *   /!!\ CAUTION: Shitty code ahead :)
   *  /_!!_\
   */
  connect(inputs = {}) {
    // todo clean this up!
    const url = inputs.local ? 'ws://localhost:8080' : this.state.url || 'ws://localhost:8080'
    const prefix = inputs.route ? ` ${inputs.route}` : ` default`

    // START LOCAL SERVER
    const wss = new WebSocket.Server({ port: 8080 })
    const connections = []
    wss.on('connection', async (ws) => {
      // todo support connect route
      connections.push(ws)
      ws.connectionId = Date.now()
      const socket = {
        id: ws.connectionId,
        domain: url,
        stage: 'local',
        log: (msg) => this.cli.log(chalk.grey(`Server: ${msg}`)),
        send: (data, id = ws.connectionId) => {
          if (id === ws.connectionId) {
            ws.send(data)
          } else {
            // todo what if connection not found?
            const otherConnection = connections.find((connection) => connection.connectionId === id)
            otherConnection.send(data)
          }
        }
      }

      const socketFilePath =
        this.state.socketFilePath || resolve(inputs.code || process.cwd(), 'socket.js')

      // we need to collect all defined routes in socket.js
      // first before running their functions to check defined routes
      const definedRoutes = []
      global.on = async (route) => {
        definedRoutes.push(route)
      }
      delete require.cache[require.resolve(socketFilePath)] // clear cache from previous invocation
      require(socketFilePath)

      ws.on('message', (body) => {
        global.on = async (route, fn) => {
          if (isJson(body)) {
            const parsedBody = JSON.parse(body)
            const receivedRoute = parsedBody.route

            // auto parse data if json
            const data = isJson(parsedBody.data) ? JSON.parse(parsedBody.data) : parsedBody.data
            if (route === receivedRoute) {
              // if received route is defined in socket.js
              const response = await fn(data, socket)
              // exit(response)
              // otherwise run the default route
            } else if (!definedRoutes.includes(receivedRoute) && route === 'default') {
              // if received body does not contain a data property
              // pass the entire body to the default route
              const defaultData = data || body
              const response = await fn(defaultData, socket)
              // exit(response)
            }
          } else if (route === 'default') {
            const response = await fn(body, socket)
            // exit(response)
          }
        }
        delete require.cache[require.resolve(socketFilePath)] // clear cache
        require(socketFilePath)
      })
    })
    // END LOCAL SERVER

    const ws = new WebSocket(url)

    this.cli.success('Connected')
    this.cli.output('URL', `    ${url}`)

    // todo there's def a better way to handle this!
    process.on('unhandledRejection', (e) => {
      console.log(e)
      wss.close()
      ws.close()
    })

    if (inputs.cli !== 'false') {
      ws.on('close', () => {
        this.cli.log('')
      })

      ws.on('error', (e) => {
        this.cli.status(e, 'red')
        this.cli.log('')
        ws.close()
        wss.close()
      })

      ws.on('open', async () => {
        // for some weird reason, there's an extra upper
        // space when connecting remotely!
        if (url !== 'ws://localhost:8080') {
          // this.cli.log('')
          // this.cli.log('')
        }

        await sleep(10) // I need to do this to refresh prompt
        const response = await prompt({
          type: 'input',
          name: 'data',
          message: prefix
        })
        if (response.data === 'exit') {
          ws.close()
          wss.close()
        } else {
          let body = response.data
          if (inputs.route) {
            body = JSON.stringify({ route: inputs.route, data: response.data })
          }
          ws.send(body)
        }
      })

      ws.on('message', async (data) => {
        this.cli.log(`${data}`)
        const response = await prompt({
          type: 'input',
          name: 'data',
          message: prefix
        })
        if (response.data === 'exit') {
          ws.close()
          wss.close()
        } else {
          let body = response.data
          if (inputs.route) {
            body = JSON.stringify({ route: inputs.route, data: response.data })
          }
          ws.send(body)
        }
      })
    }

    return ws
  }
}

module.exports = Socket
