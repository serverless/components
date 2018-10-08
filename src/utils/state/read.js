import { defn } from '@serverless/utils'

const read = defn('read', async () => {
  throw new Error('read method has not been implemented')
})

export default read
