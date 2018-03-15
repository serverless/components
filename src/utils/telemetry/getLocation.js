const BbPromise = require('bluebird')
const publicIp = require('public-ip')
const whereIs = BbPromise.promisify(require('node-where').is)

module.exports = async () => {
  const ip = await publicIp.v4()
  const location = await whereIs(ip)
  location.attributes.ip = ip
  return location.attributes
}
