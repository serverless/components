import { lookupIp } from '@serverless/utils'
import publicIp from 'public-ip'

const getLocation = async () => {
  const ip = await publicIp.v4()
  return lookupIp(ip)
}

export default getLocation
