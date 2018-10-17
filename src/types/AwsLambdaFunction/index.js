import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, createReadStream, readFileSync } from 'fs'
import { forEach, isArray, resolve } from '@serverless/utils'

const createLambda = async (
  Lambda,
  {
    functionName,
    handler,
    memorySize,
    timeout,
    runtime,
    environment,
    functionDescription,
    code,
    role
  }
) => {
  const params = {
    FunctionName: functionName,
    Code: {
      ZipFile: code
    },
    Description: functionDescription,
    Handler: handler,
    MemorySize: memorySize,
    Publish: true,
    Role: role.arn,
    Runtime: runtime,
    Timeout: timeout,
    Environment: {
      Variables: environment
    }
  }

  const res = await Lambda.createFunction(params).promise()
  return res.FunctionArn
}

const updateLambda = async (
  Lambda,
  {
    functionName,
    handler,
    memorySize,
    timeout,
    runtime,
    environment,
    functionDescription,
    code,
    role
  }
) => {
  const functionCodeParams = {
    FunctionName: functionName,
    ZipFile: code,
    Publish: true
  }

  const functionConfigParams = {
    FunctionName: functionName,
    Description: functionDescription,
    Handler: handler,
    MemorySize: memorySize,
    Role: role.arn,
    Runtime: runtime,
    Timeout: timeout,
    Environment: {
      Variables: environment
    }
  }

  await Lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await Lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return res.FunctionArn
}

const deleteLambda = async (Lambda, name) => {
  const params = { FunctionName: name }
  await Lambda.deleteFunction(params).promise()
}

const AwsLambdaFunction = async (SuperClass, superContext) => {
  const AwsIamRole = await superContext.loadType('AwsIamRole')

  return class extends SuperClass {
    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return 'deploy'
      }
      if (resolve(prevInstance.functionName) !== resolve(this.functionName)) {
        return 'replace'
      }
    }

    async define(context) {
      let role = resolve(this.role)
      if (!role) {
        role = await context.construct(
          AwsIamRole,
          {
            roleName: `${resolve(this.functionName)}-execution-role`,
            service: 'lambda.amazonaws.com',
            provider: this.provider
          },
          context
        )
        this.role = role
      }
      return { role }
    }

    getId() {
      return this.arn
    }

    pack() {
      let inputDirPath = this.code // string path to code dir

      if (isArray(this.code)) {
        inputDirPath = this.code[0] // first item is path to code dir
      }

      const outputFileName = `${this.instanceId}-${Date.now()}.zip`
      const outputFilePath = path.join(tmpdir(), outputFileName)

      return new Promise((rslv, reject) => {
        const output = createWriteStream(outputFilePath)
        const archive = archiver('zip', {
          zlib: { level: 9 }
        })

        archive.on('error', (err) => reject(err))
        output.on('close', () => {
          this.code = readFileSync(outputFilePath)
          return rslv(this)
        })

        archive.pipe(output)

        if (isArray(this.code)) {
          const shims = this.code
          shims.shift() // remove first item since it's the path to code dir
          forEach((shimFilePath) => {
            const shimStream = createReadStream(shimFilePath)
            archive.append(shimStream, { name: path.basename(shimFilePath) })
          }, shims)
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
    }

    async deploy(prevInstance, context) {
      const provider = resolve(this.provider)
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()
      await this.pack(context)

      if (!prevInstance) {
        context.log(`Creating Lambda: ${this.functionName}`)
        this.arn = await createLambda(Lambda, this)
      } else {
        context.log(`Updating Lambda: ${this.functionName}`)
        this.arn = await updateLambda(Lambda, this)
      }
    }

    async remove(context) {
      const functionName = resolve(this.functionName)
      context.log(`Removing Lambda: ${functionName}`)

      try {
        await deleteLambda(functionName)
      } catch (error) {
        if (!error.message.includes('Function not found')) {
          throw new Error(error)
        }
      }
    }
  }
}

export default AwsLambdaFunction
