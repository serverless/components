import path from 'path'
import { tmpdir } from 'os'
import { readFileSync } from 'fs'
import { hashElement } from 'folder-hash'
import {
  equals,
  get,
  isArray,
  isArchivePath,
  keys,
  not,
  packDir,
  pick,
  resolve
} from '@serverless/utils'

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
    zip,
    role
  }
) => {
  const params = {
    FunctionName: functionName,
    Code: {
      ZipFile: zip
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
    zip,
    role
  }
) => {
  const functionCodeParams = {
    FunctionName: functionName,
    ZipFile: zip,
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

const hashCode = async (code) => {
  // TODO BRN: Upgrade this to hash all code references in the array. Need to redeploy in the event that the shim changes.
  const options = {
    folders: { exclude: ['node_modules'] }
  }
  let folderToHash = code
  if (isArray(code)) {
    folderToHash = code[0]
  }
  const hashObj = await hashElement(folderToHash, options)
  return hashObj.hash
}

const AwsLambdaFunction = async (SuperClass, superContext) => {
  const AwsIamRole = await superContext.import('AwsIamRole')

  return class extends SuperClass {
    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.arn = get('arn', prevInstance)
      this.zip = get('zip', prevInstance)
    }

    async shouldDeploy(prevInstance) {
      this.hash = await hashCode(this.code)

      const currentConfig = {
        functionName: this.functionName,
        functionDescription: this.functionDescription,
        handler: this.handler,
        code: this.code,
        runtime: this.runtime,
        memorySize: this.memorySize,
        timeout: this.timeout,
        environment: this.environment,
        hash: this.hash,
        tags: this.tags
      }
      const prevConfig = prevInstance ? pick(keys(currentConfig), prevInstance) : {}
      const configChanged = not(equals(currentConfig, prevConfig))
      const roleChanged = prevInstance ? this.role.roleName !== prevInstance.role.roleName : true

      if (prevInstance && prevInstance.functionName !== currentConfig.functionName) {
        return 'replace'
      } else if (!prevInstance || configChanged || roleChanged) {
        return 'deploy'
      }
    }

    async define(context) {
      let role = resolve(this.role)
      if (!role) {
        const provider = resolve(this.provider)
        const region = resolve(provider.region)
        const AWS = provider.getSdk()
        const STS = new AWS.STS()
        const { Account } = await STS.getCallerIdentity().promise()
        role = await context.construct(
          AwsIamRole,
          {
            roleName: `${resolve(this.functionName)}-execution-role`,
            service: 'lambda.amazonaws.com',
            provider: this.provider,
            policy: {
              Version: '2012-10-17',
              Statement: [
                {
                  Action: ['logs:CreateLogStream'],
                  Resource: [
                    `arn:aws:logs:${region}:${Account}:log-group:/aws/lambda/${this.functionName}:*`
                  ],
                  Effect: 'Allow'
                },
                {
                  Action: ['logs:PutLogEvents'],
                  Resource: [
                    `arn:aws:logs:${region}:${Account}:log-group:/aws/lambda/${
                      this.functionName
                    }:*:*`
                  ],
                  Effect: 'Allow'
                }
              ]
            }
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
        shims = this.code.slice() // clone array
        shims.shift() // remove first item since it's the path to code dir
      }

      const outputFileName = `${this.instanceId}-${Date.now()}.zip`
      const outputFilePath = path.join(tmpdir(), outputFileName)

      await packDir(inputDirPath, outputFilePath, shims)
      this.zip = readFileSync(outputFilePath)
      return this.zip
    }

    async deploy(prevInstance, context) {
      const { provider } = this
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()

      if (isArchivePath(this.code)) {
        this.zip = readFileSync(this.code)
      } else {
        await this.pack(context)
      }

      if (!prevInstance || this.functionName !== prevInstance.functionName) {
        context.log(`Creating Lambda: ${this.functionName}`)
        this.arn = await createLambda(Lambda, this)
      } else {
        context.log(`Updating Lambda: ${this.functionName}`)
        this.arn = await updateLambda(Lambda, this)
      }
    }

    async remove(context) {
      const { functionName, provider } = this
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()

      context.log(`Removing Lambda: ${functionName}`)

      try {
        await deleteLambda(Lambda, functionName)
      } catch (error) {
        if (error.code !== 'ResourceNotFoundException') {
          throw error
        }
      }
    }
  }
}

export default AwsLambdaFunction
