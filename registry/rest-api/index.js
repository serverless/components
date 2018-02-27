
const convertToEventGatewayInputs = (inputs) => {
  // logic to convert from abstract rest api inputs to EG inputs
  return inputs
}

const convertToApiGatewayInputs = (inputs) => {
  // logic to convert from abstract rest api inputs to APIG inputs
  return inputs
}

const deploy = async (inputs, options, state, context) => {
  const outputs = {}
  if (inputs.gateway === 'eventgateway') {
    const eventGatewayInputs = convertToEventGatewayInputs(inputs)
    const eventGatewayComponent = await context.load('eventgateway', 'eg')
    const eventGatewayState = await eventGatewayComponent.deploy(eventGatewayInputs)
    // utilize EG state
  } else if (inputs.gateway === 'apigateway') {
    const apiGatewayInputs = convertToApiGatewayInputs(inputs)
    const apiGatewayComponent = await context.load('apigateway', 'apig')
    const apigatewayState = await apiGatewayComponent.deploy(apiGatewayInputs)
    // utilize APIG state
  }
  return outputs
}

module.exports = {
  deploy
}
