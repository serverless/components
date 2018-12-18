const construct = (Type, inputs, context) => {
  context = context.merge({ Type, root: Type.root })
  const instance = new Type.constructor(inputs, context)

  // NOTE BRN: If a construct method exists, call it now. This gives types one last chance to set values. We do this afer the instance has been instantiated using the properties so that the construct methods can make use of the property defaults that have been set by serverless.yml
  instance.construct(inputs, context)
  return instance
}

export default construct
