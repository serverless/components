import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, readFileSync } from 'fs'

const AwsLambdaFunction = {
  pack: async (instance, context) => {
    const { code, shimStream } = context.inputs

    const outputFileName = `${String(Date.now())}.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputFilePath)
      const archive = archiver('zip', {
        zlib: { level: 9 }
      })

      archive.on('error', (err) => reject(err))
      output.on('close', () => {
        return resolve(readFileSync(outputFilePath))
      })

      archive.pipe(output)

      if (shimStream) archive.append(shimStream)

      archive.glob(
        '**/*',
        {
          cwd: path.resolve(code),
          ignore: 'node_modules/aws-sdk/**'
        },
        {}
      )
      archive.finalize()
    })
  },
  deploy: async (instance, context) => {
    // todo
    // if code is path call pack above
    // otherwise if binary pass it directly to aws
  },
  remove: (instance, context) => {
    // todo
  }
}

export default AwsLambdaFunction
