import path from 'path'
import { newVariable } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Provider', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let Provider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    Provider = await context.import('Provider')
  })

  it('should return resolved credentials from getCredentials', async () => {
    const inputs = {
      credentials: {
        test: newVariable('${foo}', { foo: 'bar' })
      }
    }

    const provider = await context.construct(Provider, inputs)

    expect(provider.getCredentials()).toEqual({
      test: 'bar'
    })
  })

  it('should throw an error when getSdk is not implemented', async () => {
    const inputs = {
      credentials: {
        test: newVariable('${foo}', { foo: 'bar' })
      }
    }

    const provider = await context.construct(Provider, inputs)

    expect(() => {
      provider.getSdk()
    }).toThrow(/^Type extending Provider must implement getSdk method$/)
  })
})
