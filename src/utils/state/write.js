import { defn } from '@serverless/utils'

const write = defn('write', async () => {
  throw new Error('write method has not been implemented')
})

export default write
