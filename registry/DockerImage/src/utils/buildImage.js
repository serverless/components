import execa from 'execa'

async function buildImage(dockerfilePath, tag, contextPath) {
  await execa('docker', ['build', '--file', dockerfilePath, '--tag', tag, contextPath])

  return tag
}

export default buildImage
