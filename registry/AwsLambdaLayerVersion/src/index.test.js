import AWS from 'aws-sdk'
import path from 'path'
import { tmpdir } from 'os'
import { packDir } from '@serverless/utils'
import { readFile } from 'fs-extra'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

jest.setTimeout(30000)

jest.mock('@serverless/utils', () => ({
  ...require.requireActual('@serverless/utils'),
  packDir: jest.fn()
}))

jest.mock('fs-extra', () => ({
  ...require.requireActual('fs-extra'),
  readFile: jest.fn().mockReturnValue(Promise.resolve('zipfilecontent'))
}))

jest.mock('folder-hash', () => ({
  hashElement: jest.fn().mockReturnValue({ hash: 'abc' })
}))

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsLambdaLayerVersion', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let AwsProvider
  let AwsLambdaLayerVersion
  let provider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    AwsProvider = await context.import('AwsProvider')
    AwsLambdaLayerVersion = await context.import('./')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should pack lambda layer', async () => {
    Date.now = jest.fn(() => '1')

    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.instanceId = 'instanceId'

    const file = await awsLambdaLayerVersion.pack()

    const outputFileName = `${awsLambdaLayerVersion.instanceId}-1.zip`
    const outputFilePath = path.join(tmpdir(), outputFileName)

    expect(packDir).toBeCalledWith('./content', outputFilePath)
    expect(readFile).toBeCalledWith(outputFilePath)
    expect(awsLambdaLayerVersion.zip).toEqual('zipfilecontent')
    expect(awsLambdaLayerVersion.content).toEqual('./content')
    expect(file).toEqual('zipfilecontent')

    Date.now.mockRestore()
  })

  it('should create lambda layer when none exists', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    await awsLambdaLayerVersion.deploy(null, context)

    const publishLayerVersionParams = {
      LayerName: awsLambdaLayerVersion.layerName,
      Content: {
        ZipFile: awsLambdaLayerVersion.zip
      },
      Description: awsLambdaLayerVersion.layerDescription
    }
    expect(awsLambdaLayerVersion.arn).toEqual('abc:zxc')
    expect(AWS.mocks.publishLayerVersionMock).toBeCalledWith(publishLayerVersionParams)
  })

  it('should publish a new layer version', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description changed',
      zip: 'zipfilecontent'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    await nextAwsLambdaLayerVersion.deploy(prevAwsLambdaLayerVersion, context)

    const publishLayerVersionParams = {
      LayerName: nextAwsLambdaLayerVersion.layerName,
      Content: {
        ZipFile: nextAwsLambdaLayerVersion.zip
      },
      Description: nextAwsLambdaLayerVersion.layerDescription
    }

    expect(awsLambdaLayerVersion.arn).toEqual('abc:zxc')
    expect(AWS.mocks.publishLayerVersionMock).toBeCalledWith(publishLayerVersionParams)
  })

  it('should preserve properties when hydrated', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)
    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)
    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    expect(prevAwsLambdaLayerVersion.arn).toBe('abc:zxc')

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)
    expect(nextAwsLambdaLayerVersion).toEqual(prevAwsLambdaLayerVersion)
  })

  it('should create lambda layer if name changed', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'world', // changed!
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    await nextAwsLambdaLayerVersion.deploy(prevAwsLambdaLayerVersion, context)

    const publishLayerVersionParams = {
      LayerName: nextAwsLambdaLayerVersion.layerName,
      Content: {
        ZipFile: nextAwsLambdaLayerVersion.zip
      },
      Description: nextAwsLambdaLayerVersion.layerDescription
    }

    expect(awsLambdaLayerVersion.arn).toEqual('abc:zxc')
    expect(AWS.mocks.publishLayerVersionMock).toBeCalledWith(publishLayerVersionParams)
  })

  it('should create lambda layer when content is an archive', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: 'contentasarchive.zip',
      layerName: 'hello',
      layerDescription: 'description ok',
      zip: 'zipfilecontent_ok'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    await awsLambdaLayerVersion.deploy(null, context)

    const publishLayerVersionParams = {
      LayerName: awsLambdaLayerVersion.layerName,
      Content: {
        ZipFile: awsLambdaLayerVersion.zip
      },
      Description: awsLambdaLayerVersion.layerDescription
    }

    expect(awsLambdaLayerVersion.arn).toEqual('abc:zxc')
    expect(AWS.mocks.publishLayerVersionMock).toBeCalledWith(publishLayerVersionParams)
  })

  it('should remove lambda layer', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    await prevAwsLambdaLayerVersion.remove(context)

    const deleteLayerVersionParams = {
      LayerName: awsLambdaLayerVersion.layerName
    }

    expect(AWS.mocks.deleteLayerVersionMock).toBeCalledWith(deleteLayerVersionParams)
  })

  it('should remove lambda even if it does not exist anymore', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'already-removed-function',
      layerDescription: 'hello description',
      zip: 'zipfilecontent'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    await prevAwsLambdaLayerVersion.remove(context)

    const deleteLayerVersionParams = {
      LayerName: awsLambdaLayerVersion.layerName
    }

    expect(AWS.mocks.deleteLayerVersionMock).toBeCalledWith(deleteLayerVersionParams)
  })

  it('should return lambda arn when calling getId()', async () => {
    const awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello'
    })

    awsLambdaLayerVersion.arn = 'some:arn'

    expect(awsLambdaLayerVersion.getId()).toEqual('some:arn')
  })

  it('shouldDeploy should return deploy if name changed if retain=true', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'world', // changed!
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return replace if name changed if retain=false', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'world', // changed!
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('replace')
  })

  it('shouldDeploy should return replace if name changed if retain=previous-versions', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-versions'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'world', // changed!
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-versions'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('replace')
  })

  it('shouldDeploy should return undefined if nothing changed if retain=true', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()
    awsLambdaLayerVersion.zip = 'zipfilecontent'

    await awsLambdaLayerVersion.shouldDeploy(null, context)
    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    nextAwsLambdaLayerVersion.pack = jest.fn()
    nextAwsLambdaLayerVersion.zip = 'zipfilecontent'

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe(undefined)
    expect(awsLambdaLayerVersion.pack).toBeCalledWith(expect.anything())
    expect(nextAwsLambdaLayerVersion.pack).toBeCalledWith(expect.anything())
  })

  it('shouldDeploy should return undefined if nothing changed if retain=false', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()
    awsLambdaLayerVersion.zip = 'zipfilecontent'

    await awsLambdaLayerVersion.shouldDeploy(null, context)
    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    nextAwsLambdaLayerVersion.pack = jest.fn()
    nextAwsLambdaLayerVersion.zip = 'zipfilecontent'

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe(undefined)
    expect(awsLambdaLayerVersion.pack).toBeCalledWith(expect.anything())
    expect(nextAwsLambdaLayerVersion.pack).toBeCalledWith(expect.anything())
  })

  it('shouldDeploy should return undefined if nothing changed retain=previous-version', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-version'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()
    awsLambdaLayerVersion.zip = 'zipfilecontent'

    await awsLambdaLayerVersion.shouldDeploy(null, context)
    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-version'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    nextAwsLambdaLayerVersion.pack = jest.fn()
    nextAwsLambdaLayerVersion.zip = 'zipfilecontent'

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe(undefined)
    expect(awsLambdaLayerVersion.pack).toBeCalledWith(expect.anything())
    expect(nextAwsLambdaLayerVersion.pack).toBeCalledWith(expect.anything())
  })

  it('shouldDeploy should return deploy if config changed and retain=previous-versions', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-versions'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-versions'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return deploy if content changed and retain=previous-versions', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-versions'
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: 'previous-versions'
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)
    nextAwsLambdaLayerVersion.hash = 'newHash'

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return deploy if config changed and retain=true', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return deploy if content changed and retain=true', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: true
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)
    nextAwsLambdaLayerVersion.hash = 'newHash'

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('deploy')
  })

  it('shouldDeploy should return replace if config changed and retain=false', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('replace')
  })

  it('shouldDeploy should return replace if content changed and retain=false', async () => {
    let awsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })

    awsLambdaLayerVersion = await context.defineComponent(awsLambdaLayerVersion)

    awsLambdaLayerVersion = resolveComponentEvaluables(awsLambdaLayerVersion)

    awsLambdaLayerVersion.pack = jest.fn()

    await awsLambdaLayerVersion.deploy(null, context)

    const prevAwsLambdaLayerVersion = await deserialize(
      serialize(awsLambdaLayerVersion, context),
      context
    )

    let nextAwsLambdaLayerVersion = await context.construct(AwsLambdaLayerVersion, {
      provider,
      content: './content',
      layerName: 'hello',
      layerDescription: 'hello description',
      zip: 'zipfilecontent',
      retain: false
    })
    nextAwsLambdaLayerVersion = await context.defineComponent(
      nextAwsLambdaLayerVersion,
      prevAwsLambdaLayerVersion
    )
    nextAwsLambdaLayerVersion = resolveComponentEvaluables(nextAwsLambdaLayerVersion)
    nextAwsLambdaLayerVersion.hash = 'newHash'

    const result = await nextAwsLambdaLayerVersion.shouldDeploy(prevAwsLambdaLayerVersion, context)

    expect(result).toBe('replace')
  })
})
