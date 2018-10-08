import { generateRandomId } from '@serverless/utils'

const generateInstanceId = (appId) => {
  const suffixId = generateRandomId(8)
  return `${appId}-${suffixId}`
}

export default generateInstanceId
