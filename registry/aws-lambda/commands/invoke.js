const AWS = require('aws-sdk')

const LAMBDA_CONFIG = process.env.AWS_REGION
  ? { apiVersion: '2015-03-31' }
  : { apiVersion: '2015-03-31', region: 'us-east-1' }

function invoke(inputs, state, options) {
  if (!options.data) {
    console.log('Please supply a data payload') // eslint-disable-line
    return false
  }
  const lambda = new AWS.Lambda(LAMBDA_CONFIG)
  const functionName = state.name
  const params = {
    FunctionName: functionName,
    Payload: JSON.stringify(options.data)
  }
  return lambda
    .invoke(params)
    .promise()
    .then((response) => {
      if (response.FunctionError === 'Handled' || response.FunctionError === 'Unhandled') {
        const errorMessage = response.Payload.ErrorMesage
        throw new Error(`Lambda "${functionName}" threw an Error during invocation: ${errorMessage}`)
      }
      return response
    })
    .then((response) => {
      const data = JSON.parse(response.Payload)
      console.log(`Invoked function ${functionName}`) // eslint-disable-line
      console.log('Response', data) // eslint-disable-line
      return data
    })
}

module.exports = invoke
