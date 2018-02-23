const axios = require('axios')

const invoke = async (inputs, state, context, options) => {
  context.cli.log(`Testing Endpoint: ${state.url}`)

  try {
    const res = await axios({
      method: 'post',
      url: state.url,
      data: {}
    })
    context.cli.log('')
    context.cli.log('Result:')
    context.cli.log(res.data)
  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  invoke
}
