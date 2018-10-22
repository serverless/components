import path from 'path'
import { tmpdir } from 'os'
import { readFileSync } from 'fs'
import { isArray, resolve, packDir } from '@serverless/utils'

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

    async pack() {
      let shims = []
      let inputDirPath = this.code

      if (isArray(this.code)) {
        inputDirPath = this.code[0] // first item is path to code dir
        shims = this.code
        shims.shift() // remove first item since it's the path to code dir
      }

      const outputFileName = `${this.instanceId}-${Date.now()}.zip`
      const outputFilePath = path.join(tmpdir(), outputFileName)

      await packDir(inputDirPath, outputFilePath, shims)
      this.code = readFileSync(outputFilePath)
      return this.code
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
      const provider = resolve(this.provider)
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()
      const functionName = resolve(this.functionName)

      context.log(`Removing Lambda: ${functionName}`)

      try {
        await deleteLambda(Lambda, functionName)
      } catch (error) {
        if (!error.message.includes('Function not found')) {
          throw new Error(error)
        }
      }
    }
  }
}

export default AwsLambdaFunction
