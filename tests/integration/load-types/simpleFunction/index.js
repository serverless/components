module.exports.hello = (event, context) => {
  context.compute // AwsLambda
  context.name // function name
  context.memory
  context.timeout
  context.runtime
  context.invocationId // invocation or request id

  return {}
}
