// TODO: update so that `inputs` can have an arbitrary length
async function callFunc(that, func, inputs) {
  const result = {
    error: null,
    data: null
  }

  try {
    const res = await that[func].call(that, inputs)
    result.data = res
  } catch (error) {
    result.error = error
  } finally {
    return result
  }
}

module.exports = callFunc
