const construct = async (Type, inputs, context) => {
  context = context.merge({ Type, root: Type.root })
  return new Type.constructor(inputs, context)
}

export default construct
