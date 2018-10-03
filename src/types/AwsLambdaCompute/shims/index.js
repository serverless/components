module.exports.hello = (cloudEvent, context) => {
  console.log(cloudEvent)
  // // eslint-disable-next-line
  // console.log('cloudEvent:', cloudEvent)
  // // eslint-disable-next-line
  // console.log('context:', context)
  return { foo: 'bar' }
}
