const Cron = {
  async define(context) {
    return { schedule: this.function.defineSchedule(this.rate, context) }
  }
}

export default Cron
