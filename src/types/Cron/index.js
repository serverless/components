const Cron = {
  construct(inputs) {
    this.function = inputs.function
    this.rate = inputs.rate
  },
  async define(context) {
    const Function = await context.loadType('Function')
    const fnInputs = this.function.get()
    const compute = fnInputs.compute.get()
    const fn = await context.construct(Function, fnInputs)
    return {
      schedule: await compute.defineSchedule(fn, this.rate, context)
    }
  }
}

export default Cron
