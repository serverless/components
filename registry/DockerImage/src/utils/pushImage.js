import execa from 'execa'

async function pushImage(tag) {
  await execa('docker', ['push', tag])
  return tag
}

export default pushImage
