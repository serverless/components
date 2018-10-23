import execa from 'execa'

async function removeImage(tag) {
  await execa('docker', ['rmi', '--force', true, tag])
  return tag
}

export default removeImage
