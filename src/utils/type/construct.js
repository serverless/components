const construct = async (Type, inputs, context) => await new Type.constructor(inputs, context, Type)

export default construct
