const Cron = {
  construct(inputs) {
    this.function = inputs.function
    this.rate = inputs.rate
  },
  async define(context) {
    const functionInstance = this.function.get()
    const computeInstance = functionInstance.compute.get()
    return {
      schedule: await computeInstance.defineSchedule(functionInstance, this.rate, context)
    }
  }
}

export default Cron
