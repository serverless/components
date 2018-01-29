const axios = require('axios')

module.exports = async (inputs, state) => {
  console.log(`Testing Endpoint: ${state.url}`)

  try {
    const res = await axios({
      method: 'post',
      url: state.url,
      data: {}
    })
    console.log('')
    console.log('Result:')
    console.log(res.data)
  } catch (e) {
    throw new Error(e)
  }
}
