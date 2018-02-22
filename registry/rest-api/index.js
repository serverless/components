
const convertToEventGatewayInputs = (inputs) => {
  // logic to convert from abstract rest api inputs to EG inputs
  return inputs
}

const convertToApiGatewayInputs = (inputs) => {
  // logic to convert from abstract rest api inputs to APIG inputs
  return inputs
}

const deploy = async (inputs, state, context, options) => {
  const outputs = {}
  if (inputs.gateway === 'eventgateway') {
    const eventGatewayInputs = convertToEventGatewayInputs(inputs)
    const eventGatewayState = state.eventgateway || {}
    const eventGatewayComponent = await context.loadComponent('eventgateway')
    outputs.eventgateway = await eventGatewayComponent.deploy(eventGatewayInputs, eventGatewayState, context, options)
  } else if (inputs.gateway === 'apigateway') {
    const apiGatewayInputs = convertToApiGatewayInputs(inputs)
    const apiGatewayState = state.apigateway || {}
    const apiGatewayComponent = await context.loadComponent('apigateway')
    outputs.apigateway = await apiGatewayComponent.deploy(apiGatewayInputs, apiGatewayState, context, options)
  }
  return outputs
}

module.exports = {
  deploy
}
