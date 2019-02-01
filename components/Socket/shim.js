// todo clean this up

const AWS = require('aws-sdk')

/* START ApiGatewayManagementApi injection */
const { Service, apiLoader } = AWS

apiLoader.services['apigatewaymanagementapi'] = {}

const model = {
  metadata: {
    apiVersion: '2018-11-29',
    endpointPrefix: 'execute-api',
    signingName: 'execute-api',
    serviceFullName: 'AmazonApiGatewayManagementApi',
    serviceId: 'ApiGatewayManagementApi',
    protocol: 'rest-json',
    jsonVersion: '1.1',
    uid: 'apigatewaymanagementapi-2018-11-29',
    signatureVersion: 'v4'
  },
  operations: {
    PostToConnection: {
      http: {
        requestUri: '/@connections/{connectionId}',
        responseCode: 200
      },
      input: {
        type: 'structure',
        members: {
          Data: {
            type: 'blob'
          },
          ConnectionId: {
            location: 'uri',
            locationName: 'connectionId'
          }
        },
        required: ['ConnectionId', 'Data'],
        payload: 'Data'
      }
    }
  },
  paginators: {},
  shapes: {}
}

AWS.ApiGatewayManagementApi = Service.defineService('apigatewaymanagementapi', ['2018-11-29'])
Object.defineProperty(apiLoader.services['apigatewaymanagementapi'], '2018-11-29', {
  // eslint-disable-next-line
  get: function get() {
    return model
  },
  enumerable: true,
  configurable: true
})
/* END ApiGatewayManagementApi injection */

const isJson = (body) => {
  try {
    JSON.parse(body)
  } catch (e) {
    return false
  }
  return true
}

/*
 * connection management:
 *  - if no connect route is defined, connect is successful by default
 *  - if connect route is defined, it'll connect or reject based on returned status code
 *
 * default route:
 *  - runs if body is not json
 *  - runs if body is json but the received route is not defined in socket.js
 *  - gets passed the received data if it exists, otherwise, gets passed the entire body
 */

/*
 * TESTS
 *  - connect is defined and returns 500 - WORKS
 *  - connect is defined and return 200
 *    - does default work? - WORKS
 *    - does defined route work? - WORKS
 *    - does undefined route with data runs the default route and pass the data? - WORKS
 *    - does undefined route with no data runs the default route and pass the entire body? - WORKS
 *    - does any body shape runs the default route and pass the entire body? - WORKS
 *  - no connect defined
 *    - does default work? - WORKS
 *    - does defined route work? - WORKS
 *    - does undefined route with data runs the default route and pass the data? - WORKS
 *    - does undefined route with no data runs the default route and pass the entire body? - WORKS
 *    - does any body shape runs the default route and pass the entire body? - WORKS
 */

module.exports.socket = (e, ctx, cb) => {
  const { requestContext, body } = e
  const { routeKey, eventType, connectionId, domainName, stage } = requestContext

  const exit = (returnValue) => {
    if (typeof returnValue === 'number') {
      cb(null, { statusCode: returnValue })
    } else if (typeof returnValue === 'object') {
      cb(null, returnValue)
    } else {
      // success by default
      cb(null, {
        statusCode: 200
      })
    }
  }

  const socket = {
    id: connectionId,
    domain: domainName,
    stage,
    log: (msg) => console.log(msg),
    send: (data, id = connectionId) => {
      const client = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `https://${domainName}/${stage}`
      })

      return client
        .postToConnection({
          ConnectionId: id,
          Data: data
        })
        .promise()
    }
  }

  // we need to collect all defined routes in socket.js
  // first before running their functions to check defined routes
  const definedRoutes = []
  global.on = async (route) => {
    definedRoutes.push(route)
  }
  delete require.cache[require.resolve('./socket')] // clear cache from previous invocation
  require('./socket.js')

  // I know globals are discouraged, but I think
  // we can make an exception for this single case
  // for the sake of UX
  global.on = async (route, fn) => {
    if (route === eventType.toLowerCase() && eventType !== 'MESSAGE') {
      // if connecting or disconnecting...
      const response = await fn(null, socket)
      exit(response)
    } else if (routeKey === '$default') {
      // if any other route...
      if (isJson(body)) {
        const parsedBody = JSON.parse(body)
        const receivedRoute = parsedBody.route

        // auto parse data if json
        const data = isJson(parsedBody.data) ? JSON.parse(parsedBody.data) : parsedBody.data
        if (route === receivedRoute) {
          // if received route is defined in socket.js
          const response = await fn(data, socket)
          exit(response)
          // otherwise run the default route
        } else if (!definedRoutes.includes(receivedRoute) && route === 'default') {
          // if received body does not contain a data property
          // pass the entire body to the default route
          const defaultData = data || body
          const response = await fn(defaultData, socket)
          exit(response)
        }
      } else if (route === 'default') {
        const response = await fn(body, socket)
        exit(response)
      }
    } else if (!definedRoutes.includes('connect') && routeKey !== '$default') {
      exit()
    }
  }

  delete require.cache[require.resolve('./socket')] // clear cache from previous require
  require('./socket.js')
}
