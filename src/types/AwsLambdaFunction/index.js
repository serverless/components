import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, readFileSync } from 'fs'
import { forEach } from 'ramda'

/*
 * Code:
 *   - String - path to src dir or package file binarys
 *   - Array of Strings - first item is path to src dir, rest are paths to shim files
 *   - Buffer - package file binary
 */
const AwsLambdaFunction = {
  pack: async (instance) => {
    let inputDirPath = instance.Code

    if (typeof instance.Code === Array) inputDirPath = instance.Code[0]

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

      if (typeof instance.Code === Array) {
        forEach((shim) => {
          if (typeof shim !== String) archive.append(shim)
        }, instance.Code)
      }

      archive.glob(
        '**/*',
        {
          cwd: path.resolve(inputDirPath),
          ignore: 'node_modules/aws-sdk/**'
        },
        {}
      )
      archive.finalize()
    })
  },
  deploy: async (instance, context) => {
    // todo
    // if code is buffer dont call pack above
  },
  remove: (instance, context) => {
    // todo
  }
}

export default AwsLambdaFunction
