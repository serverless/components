const Function = {
  async define(context) {
    const compute = this.compute.get() // what if this is not a variable? we need resolve()
    return { fn: await compute.defineFunction(this, context) }
  }
}

export default Function
