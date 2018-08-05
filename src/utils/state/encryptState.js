const { decrypt, encrypt } = require('../encryption')
const encryptState = (content) => {
  if (process.env.COMPONENTS_ENC_STATE !== 'true') {
    return content
  }
  return {
    encrypted: encrypt(
      'aes-256-cbc',
      process.env.COMPONENTS_ENC_KEY,
      process.env.COMPONENTS_ENC_IV,
      JSON.stringify(content),
      'base64'
    )
  }
}
const decryptState = (content) => {
  if (content.encrypted) {
    process.env.COMPONENTS_ENC_STATE = true
    return JSON.parse(
      decrypt(
        'aes-256-cbc',
        process.env.COMPONENTS_ENC_KEY,
        process.env.COMPONENTS_ENC_IV,
        content.encrypted,
        'base64'
      )
    )
  }
  return content
}

module.exports = {
  encryptState,
  decryptState
}
