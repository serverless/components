import path from 'path'
import { tmpdir } from 'os'
import archiver from 'archiver'
import { createWriteStream, readFileSync } from 'fs'
import { forEach } from 'ramda'

/*
 * Code:
 *   - String - path to src dir or package file binaries
 *   - Array of Strings - first item is path to src dir, rest are paths to shim files
 *   - Buffer - package file binary
 */

const createLambda = async (
  Lambda,
  { FunctionName, Handler, MemorySize, Timeout, Runtime, Environment, Description, Code, Role }
) => {
  const params = {
    FunctionName,
    Code: {
      ZipFile: Code
    },
    Description,
    Handler,
    MemorySize,
    Publish: true,
    Role,
    Runtime: Runtime,
    Timeout: Timeout,
    Environment: {
      Variables: Environment
    }
  }

  const res = await Lambda.createFunction(params).promise()
  return {
    arn: res.FunctionArn,
    roleArn: Role
  }
}

const updateLambda = async (
  Lambda,
  { FunctionName, Handler, MemorySize, Timeout, Runtime, Environment, Description, Code, Role }
) => {
  const functionCodeParams = {
    FunctionName,
    ZipFile: Code,
    Publish: true
  }

  const functionConfigParams = {
    FunctionName,
    Description,
    Handler,
    MemorySize,
    Role,
    Runtime,
    Timeout,
    Environment: {
      Variables: Environment
    }
  }

  await Lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await Lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return {
    arn: res.FunctionArn,
    roleArn: Role
  }
}

const deleteLambda = async (Lambda, FunctionName) => {
  const params = { FunctionName }

  await Lambda.deleteFunction(params).promise()
  return {
    arn: null
  }
}

export const pack = async (instance) => {
  const { FunctionName, Handler, Code, Runtime, MemorySize, Timeout } = instance
  const outputs = { FunctionName, Handler, Code, Runtime, MemorySize, Timeout }
  let inputDirPath = outputs.Code

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
      outputs.Code = readFileSync(outputFilePath)
      return resolve(outputs)
    })

    archive.pipe(output)

    if (typeof outputs.Code === Array) {
      forEach((shim) => {
        if (typeof shim !== String) archive.append(shim)
      }, outputs.Code)
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

export const deploy = async (instance, context) => {
  const Lambda = new instance.Provider.getSdk().Lambda
  let outputs = {}
  const configuredRoleArn = instance.Role
  let { defaultRoleArn } = context.state

  const DefaultRole = await context.loadType('AwsIamRole')

  const defaultRole = context.construct(
    DefaultRole,
    {
      name: `${instance.FunctionName}-execution-role`,
      service: 'lambda.amazonaws.com',
      provider: instance.provider
    },
    context
  )

  if (!configuredRoleArn && !defaultRoleArn) {
    const defaultRoleOutputs = await defaultRole.deploy(context)
    defaultRoleArn = defaultRoleOutputs.Arn
  }

  instance.Role = configuredRoleArn || defaultRoleArn

  if (instance.FunctionName && !context.state.name) {
    context.log(`Creating Lambda: ${instance.FunctionName}`)
    outputs = await createLambda(Lambda, instance)
  } else if (context.state.name && !instance.FunctionName) {
    context.log(`Removing Lambda: ${context.state.FunctionName}`)
    outputs = await deleteLambda(Lambda, context.state.FunctionName)
  } else if (instance.FunctionName !== context.state.FunctionName) {
    context.log(`Removing Lambda: ${context.state.FunctionName}`)
    await deleteLambda(Lambda, context.state.FunctionName)
    context.log(`Creating Lambda: ${instance.FunctionName}`)
    outputs = await createLambda(Lambda, instance)
  } else {
    context.log(`Updating Lambda: ${instance.FunctionName}`)
    outputs = await updateLambda(Lambda, instance)
  }

  if (configuredRoleArn && defaultRoleArn) {
    await defaultRole.remove(context)
    defaultRoleArn = null
  }

  context.saveState({ ...inputs, ...outputs, defaultRoleArn })
  return outputs
}

export const remove = async (instance, context) => {}
