const deserialize = async (serialized) => {
  if (serialized.type !== 'undefined') {
    throw new TypeError(
      `undefined.deserialize expected a serialized undefined. Instead was given ${serialized}`
    )
  }
  return undefined
}

export default deserialize
