const AWS = require('aws-sdk')
const utils = require('../../lib/utils')

// TODO: region is hardcoded, because the S3 component also hardcodes it.
const S3 = new AWS.S3({ region: 'us-east-1' })

const deploy = async (inputs, state, context) => {
  // const staticContentPath = path.join(process.cwd(), inputs.contentPath)
  const staticContentPath = inputs.contentPath

  const filePaths = await utils.walkDirSync(staticContentPath)
  context.log(filePaths)

  // const uploadedFiles = []
  // const uploadRequests = []
  // for (const file of listFiles(staticContentPath)) {
  //   uploadRequests.push(S3.putObject({
  //     Bucket: inputs.bucketName,
  //     Key: path.relative(staticContentPath, file),
  //     Body: fs.readFileSync(file),
  //     ContentType: mime.lookup(file)
  //   })
  //     .promise()
  //     .then(() => uploadedFiles.push(file)))
  // }
  //
  // await Promise.all(uploadRequests)

  const outputs = {
    filePaths
  }
  return outputs
}

module.exports = {
  deploy
}
