const construct = async (Type, inputs, context) => {
  context = context.merge({ Type })
  return new Type.constructor(inputs, context)
}

export default construct
