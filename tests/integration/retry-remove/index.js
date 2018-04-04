module.exports = {
  async deploy(inputs, context) {
    throw new Error('aaaah')
    console.log('what....')
    context.saveState({ deployed: true, triedToRemove: false })
    console.log('why....')
  }

  async remove(inputs, context) {
    if(triedToRemove) {
      context.saveState()
    } else {
      context.saveState({ ...context.state, triedToRemove: true })
    }
  }
}
