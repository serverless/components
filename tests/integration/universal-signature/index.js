export const hello = (event, context) => {
  context.emit()
  context.compute // AwsLambda
  context.name // function name
  context.memory
  context.timeout
  context.runtime
  context.invocationId // invocation or request id

  return {}
}
