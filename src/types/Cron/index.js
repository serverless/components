const Cron = {
  async define(context) {
    // console.log(this.function.get())
    const functionInstance = this.function
    const computeInstance = functionInstance.compute.get()
    return {
      schedule: await computeInstance.defineSchedule(this.function, this.rate, context)
    }
  }
}

export default Cron
