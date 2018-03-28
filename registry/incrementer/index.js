module.exports = {
  async deploy(inputs, context) {
    let count = (context.state && context.state.count) || 0
    count += 1
    context.saveState({ count })
  }
}
