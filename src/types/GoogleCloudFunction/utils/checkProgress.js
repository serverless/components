const delay = require('./delay')
const getOperation = require('./getOperation')

async function checkProgress(provider, name) {
  let isDone = false
  let result = null

  do {
    result = await getOperation(provider, name)
    isDone = result.done
    if (!isDone) {
      await delay(3000)
    }
  } while (!isDone)

  if (result.error) {
    throw new Error(
      'Function deployment / removal failed. Please re-check your function configuration...'
    )
  }

  return result
}

module.exports = checkProgress
