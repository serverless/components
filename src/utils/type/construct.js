const construct = (type, inputs, context) => new type.constructor(inputs, context)

export default construct
