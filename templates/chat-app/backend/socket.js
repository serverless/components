const AWS = require("aws-sdk")
AWS.config.update({ region: process.env.AWS_REGION })
const DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" })
const DDBDoc = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

/**
 * Connect
 */

on('connect', async (data, socket) => {

  console.log('connect')

  var params = {
    TableName: process.env.dbConnectionsName,
    Item: {
      connectionId: { S: socket.id }
    },
  }

  let result
  try {
    result = await DDB.putItem(params).promise()
  } catch(error) {
    throw new Error(error)
  }

  socket.send(JSON.stringify({ status: 'connected' }))
})

/**
 * Disconnect
 */

on('disconnect', async (data, socket) => {

  console.log('disconnect')

  var params = {
    TableName: process.env.dbConnectionsName,
    Key: {
      connectionId: { S: socket.id }
    }
  }

  let result
  try {
    result = await DDB.deleteItem(params).promise()
  } catch(error) {
    throw new Error(error)
  }

  await socket.send({ status: 'disconnected' })
})

/**
 * Default
 */

on('default', async (data, socket) => {

  console.log('default', socket, data)

  let connectionData
  try {
    connectionData = await DDBDoc.scan({
      TableName: process.env.dbConnectionsName,
      ProjectionExpression: 'connectionId'
    }).promise()
  } catch (error) {
    throw new Error(error)
  }

  const postCalls = connectionData.Items.map(async ({ connectionId }) => {
    console.log('sending to: ', connectionId)
    await socket.send(data, connectionId)
  })
})
