'use strict'

module.exports.getTime = async () => {
  const response = await fetch(window.env.apiUrl)
  const result = await response.json()
  const message = result.message

  console.log('** Time Fetched **')
  console.log(message)

  return message
}
