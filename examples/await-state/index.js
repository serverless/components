module.exports = {
  async deploy(inputs, context) {
    const child = await context.children.child
    context.log(`CHILD STATE: ${JSON.stringify(child.state)}`)
  }
}
