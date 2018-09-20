import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, createReadStream, readFileSync } from 'fs'
import { forEach, is } from 'ramda'

/*
 * Code:
 *   - String - path to src dir or package file binaries
 *   - Array of Strings - first item is path to src dir, rest are paths to shim files
 *   - Buffer - package file binary
 */

const createLambda = async (
  Lambda,
  { name, handler, memory, timeout, runtime, environment, description, code, role }
) => {
  const params = {
    FunctionName: name,
    Code: {
      ZipFile: code
    },
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Publish: true,
    Role: role,
    Runtime: runtime,
    Timeout: timeout,
    Environment: {
      Variables: environment
    }
  }

  const res = await Lambda.createFunction(params).promise()
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
    this.name = inputs.name
    this.handler = inputs.handler
    this.code = inputs.code
    this.runtime = inputs.runtime
    this.description = inputs.description
    this.memory = inputs.memory
    this.timeout = inputs.timeout
    this.environment = inputs.environment
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
        return resolve({
          provider: this.provider,
          name: this.name,
          handler: this.handler,
          code: this.code,
          memory: this.memory,
          timeout: this.timeout,
          description: this.description,
          environment: this.environment,
          runtime: this.runtime,
          arn: this.arn,
          roleArn: this.roleArn
        })
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

  async deploy(context) {
    let defaultRoleName
    const Lambda = new this.provider.sdk.Lambda()
    let outputs = {}
    const configuredRoleArn = this.role
    let { defaultRoleArn } = context.state

    const DefaultRole = await context.loadType('AwsIamRole')

    const defaultRole = await context.construct(
      DefaultRole,
      {
        name: `${this.name}-execution-role`,
        service: 'lambda.amazonaws.com',
        provider: this.provider
      },
      context
    )

    if (!configuredRoleArn && !defaultRoleArn) {
      const defaultRoleOutputs = await defaultRole.deploy(context)
      defaultRoleArn = defaultRoleOutputs.arn
      defaultRoleName = defaultRoleOutputs.name
    }

    this.role = configuredRoleArn || defaultRoleArn

    if (is(String, this.code)) {
      await this.pack()
    }

    if (this.name && !context.state.name) {
      context.log(`Creating Lambda: ${this.name}`)
      outputs = await createLambda(Lambda, this)
    } else if (context.state.name && !this.name) {
      context.log(`Removing Lambda: ${context.state.name}`)
      outputs = await deleteLambda(Lambda, context.state.name)
    } else if (this.name !== context.state.name) {
      context.log(`Removing Lambda: ${context.state.name}`)
      await deleteLambda(Lambda, context.state.name)
      context.log(`Creating Lambda: ${this.name}`)
      outputs = await createLambda(Lambda, this)
    } else {
      context.log(`Updating Lambda: ${this.name}`)
      outputs = await updateLambda(Lambda, this)
    }

    if (configuredRoleArn && defaultRoleArn) {
      await defaultRole.remove(context)
      defaultRoleName = null
    }

    context.saveState({ ...outputs, defaultRoleArn, defaultRoleName })
    return outputs
  },

  async remove(context) {
    const outputs = {
      name: null,
      handler: null,
      memory: null,
      timeout: null,
      description: null,
      runtime: null,
      arn: null,
      roleArn: null
    }
    if (!context.state.name) return outputs

    if (context.state.defaultRoleName) {
      const DefaultRole = await context.loadType('AwsIamRole')
      const defaultRole = await context.construct(
        DefaultRole,
        {
          name: context.state.defaultRoleName,
          provider: this.provider
        },
        context
      )
      await defaultRole.remove(context)
    }

    context.log(`Removing Lambda: ${context.state.name}`)

    try {
      await deleteLambda(context.state.name)
    } catch (error) {
      if (!error.message.includes('Function not found')) {
        throw new Error(error)
      }
    }
    context.saveState(outputs)
    return outputs
  },

  // NOTE: this is the implementation for the ISink interface
  getSinkConfig() {
    return {
      uri: this.arn,
      protocol: 'AwsLambdaFunction'
    }
  }
}

export default AwsLambdaFunction
