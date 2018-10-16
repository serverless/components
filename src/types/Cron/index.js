import { resolve } from '@serverless/utils'

const Cron = {
  async define(context) {
    const functionInstance = resolve(this.function)
    const computeInstance = resolve(functionInstance.compute)
    return {
      schedule: await computeInstance.defineSchedule(functionInstance, resolve(this.rate), context)
    }
  }
}

export default Cron
