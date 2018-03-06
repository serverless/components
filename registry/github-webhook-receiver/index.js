const axios = require('axios')

const invoke = async (inputs, context) => {
  context.log(`Testing Endpoint: ${inputs.url}`)

  try {
    const res = await axios({
      method: 'post',
      url: inputs.url,
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
