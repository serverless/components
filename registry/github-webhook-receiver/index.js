const axios = require('axios')

const invoke = async (inputs, options, state, context) => {
  context.log(`Testing Endpoint: ${state.url}`)

  try {
    const res = await axios({
      method: 'post',
      url: state.url,
      data: {}
    })
    context.log('')
    context.log('Result:')
    context.log(res.data)
  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  invoke
}
