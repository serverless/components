const Cron = {
  construct(inputs) {
    this.function = inputs.function
    this.rate = inputs.rate
  },
  async define(context) {
    console.log('dude')
    const fn = this.function.get()
    const compute = fn.compute.get()
    return {
      schedule: await compute.defineSchedule(fn, this.rate, context)
    }
  }
}

export default Cron
