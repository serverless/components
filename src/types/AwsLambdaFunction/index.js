import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, createReadStream, readFileSync } from 'fs'
import { forEach, is } from '@serverless/utils'

const createLambda = async (
  Lambda,
  { functionName, handler, memory, timeout, runtime, environment, description, code, role }
) => {
  const params = {
    FunctionName: functionName,
    Code: {
      ZipFile: code
    },
    Description: description,
    Handler: handler,
    MemorySize: memory,
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
  { name, handler, memory, timeout, runtime, environment, description, code, role }
) => {
  const functionCodeParams = {
    FunctionName: name,
    ZipFile: code,
    Publish: true
  }

  const functionConfigParams = {
    FunctionName: name,
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Role: role,
    Runtime: runtime,
    Timeout: timeout,
    Environment: {
      Variables: environment
    }
  }

  await Lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await Lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return {
    name,
    handler,
    memory,
    timeout,
    description,
    runtime,
    arn: res.FunctionArn,
    roleArn: role
  }
}

const deleteLambda = async (Lambda, name) => {
  const params = { FunctionName: name }

  await Lambda.deleteFunction(params).promise()
  return {
    name: null,
    handler: null,
    memory: null,
    timeout: null,
    description: null,
    runtime: null,
    arn: null,
    roleArn: null
  }
}

const AwsLambdaFunction = {
  construct(inputs) {
    this.provider = inputs.provider
    this.functionName = 'v2-demo-hello-10'
    this.memorySize = inputs.memorySize
    this.timeout = inputs.timeout
    this.runtime = inputs.runtime
    this.handler = inputs.handler
    this.environment = inputs.environment
    this.code = inputs.code
  },
  async pack() {
    let inputDirPath = this.code // string path to code dir

    if (is(Array, this.code)) inputDirPath = this.code[0] // first item is path to code dir

    const outputFileName = `${String(Date.now())}.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputFilePath)
      const archive = archiver('zip', {
        zlib: { level: 9 }
      })

      archive.on('error', (err) => reject(err))
      output.on('close', () => {
        this.code = readFileSync(outputFilePath)
        return resolve(this)
      })

      archive.pipe(output)

      if (is(Array, this.code)) {
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
  },
  async define(context) {
    if (!this.role) {
      const DefaultRole = await context.loadType('AwsIamRole')

      this.role = await context.construct(
        DefaultRole,
        {
          name: `${this.functionName}-execution-role`,
          service: 'lambda.amazonaws.com',
          provider: this.provider
        },
        context
      )
    }
    return { role: this.role } // arn:
  },
  async deploy(prevInstance, context) {
    const AWS = this.provider.getSdk()
    const Lambda = new AWS.Lambda()
    console.log('lambda')
    await this.pack(context)

    if (!prevInstance) {
      context.log(`Creating Lambda: ${this.functionName}`)
      this.arn = await createLambda(Lambda, this)
    } else if (prevInstance.name && !this.name) {
      context.log(`Removing Lambda: ${prevInstance.name}`)
      this.arn = await deleteLambda(Lambda, prevInstance.name)
    } else if (this.name !== prevInstance.name) {
      context.log(`Removing Lambda: ${prevInstance.name}`)
      await deleteLambda(Lambda, prevInstance.name)
      context.log(`Creating Lambda: ${this.name}`)
      this.arn = await createLambda(Lambda, this)
    } else {
      context.log(`Updating Lambda: ${this.name}`)
      this.arn = await updateLambda(Lambda, this)
    }
    // await context.saveState({ arn: this.arn })
  },
  async remove(prevInstance, context) {
    if (!prevInstance.name) return this

    context.log(`Removing Lambda: ${prevInstance.name}`)

    try {
      await deleteLambda(prevInstance.name)
    } catch (error) {
      if (!error.message.includes('Function not found')) {
        throw new Error(error)
      }
    }
    return this
  },
  async defineSchedule(schedule, context) {
    const AwsEventsRule = await context.loadType('../AwsEventsRule')
    const awsEventsRuleInputs = {
      provider: this.provider,
      lambdaArn: this.arn,
      schedule,
      enabled: true
    }
    return context.construct(AwsEventsRule, awsEventsRuleInputs)
  },
  getSinkConfig() {
    return {
      uri: this.arn,
      protocol: 'AwsLambdaFunction'
    }
  }
}

export default AwsLambdaFunction
