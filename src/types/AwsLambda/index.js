import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, createReadStream, readFileSync } from 'fs'

const AwsLambda = {
  pack: async (instance, context) => {
    const { name, memory, timeout, runtime, handler, env, code } = context.inputs

    const outputFileName = `${String(Date.now())}.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)
    const pkg = {
      name,
      memory,
      timeout,
      runtime,
      handler,
      env
    }

    pkg.env.SERVERLESS_HANDLER = handler

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputFilePath)
      const archive = archiver('zip', {
        zlib: { level: 9 }
      })

      archive.on('error', (err) => reject(err))
      output.on('close', () => {
        pkg.code = readFileSync(outputFilePath)
        return resolve(pkg)
      })

      archive.pipe(output)

      let shimFile
      let handlerFile

      if (runtime === 'nodejs8.10') {
        shimFile = 'shim.js'
        handlerFile = 'handler.js'
      } // todo other runtimes

      const handlerTemplateFilePath = path.join(__dirname, 'shims', shimFile)
      archive.append(createReadStream(handlerTemplateFilePath), { name: handlerFile })
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
  },
  remove: (instance, context) => {
    // todo
  }
}

export default AwsLambda
