import path from 'path'
import {
  createContext,
  deserialize,
  resolveComponentEvaluables,
  serialize
} from '../../../src/utils'

jest.mock('folder-hash', () => ({
  hashElement: jest.fn().mockReturnValue({ hash: 'abc' })
}))

jest.mock('fs', () => ({
  ...require.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}))

let context
let provider
let AwsS3Website

const createTestContext = async () =>
  createContext(
    {
      cwd: path.join(__dirname, '..'),
      overrides: {
        debug: () => {},
        log: () => {}
      }
    },
    {
      app: {
        id: 'test'
      }
    }
  )

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsS3Website', () => {
  beforeEach(async () => {
    context = await createTestContext()
    AwsS3Website = await context.loadType('./')

    const AwsProvider = await context.loadType('AwsProvider')
    provider = await context.construct(AwsProvider, {})
  })
  it('shouldDeploy should return undefined if no changes', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)

    let newAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    newAwsS3Website = await context.defineComponent(newAwsS3Website)
    newAwsS3Website = resolveComponentEvaluables(newAwsS3Website)

    const res = newAwsS3Website.shouldDeploy(prevAwsS3Website)
    expect(res).toBe(undefined)
  })

  it('shouldDeploy should return deploy if first deployment', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    const res = await oldAwsS3Website.shouldDeploy(null, context)
    expect(res).toBe('deploy')
  })

  it('shouldDeploy should return deploy if config changed', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)

    let newAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./src'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    newAwsS3Website = await context.defineComponent(newAwsS3Website)
    newAwsS3Website = resolveComponentEvaluables(newAwsS3Website)

    const res = newAwsS3Website.shouldDeploy(prevAwsS3Website)
    expect(res).toBe('deploy')
  })

  it('shouldDeploy should return replace if bucket changed', async () => {
    let oldAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'abc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    oldAwsS3Website = await context.defineComponent(oldAwsS3Website)
    oldAwsS3Website = resolveComponentEvaluables(oldAwsS3Website)
    await oldAwsS3Website.deploy(null, context)

    const prevAwsS3Website = await deserialize(serialize(oldAwsS3Website, context), context)

    let newAwsS3Website = await context.construct(AwsS3Website, {
      provider,
      bucket: 'zxc',
      projectDir: path.resolve('./registry'),
      assets: path.resolve('./registry'),
      envFileLocation: path.resolve('./src/index.js')
    })
    newAwsS3Website = await context.defineComponent(newAwsS3Website)
    newAwsS3Website = resolveComponentEvaluables(newAwsS3Website)

    const res = newAwsS3Website.shouldDeploy(prevAwsS3Website)
    expect(res).toBe('replace')
  })
})
