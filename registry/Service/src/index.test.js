import { resolve } from '@serverless/utils'
import path from 'path'
import { createContext } from '../../../src/utils'

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

describe('Service', () => {
  it('should default components and functions to empty objects', async () => {
    const context = await createTestContext()
    const Service = await context.loadType('Service')
    const service = await context.construct(Service, {})

    expect(resolve(service.components)).toEqual({})
    expect(resolve(service.functions)).toEqual({})
  })

  it('should construct function instances when construct is called', async () => {
    const context = await createTestContext()
    const Service = await context.loadType('Service')
    const Function = await context.loadType('Function')

    const service = await context.construct(Service, {
      functions: {
        hello: {
          functionName: 'hello',
          code: './code',
          handler: 'index.hello'
        }
      }
    })

    expect(service.functions.hello).toBeInstanceOf(Function.class)
    expect(resolve(service.functions.hello.functionName)).toBe('hello')
  })

  it('should define functions as instances', async () => {
    const context = await createTestContext()
    const Service = await context.loadType('Service')
    const Fn = await context.loadType('Function')

    const service = await context.construct(Service, {
      functions: {
        hello: {
          functionName: 'hello',
          code: './code',
          handler: 'index.hello'
        }
      }
    })

    const children = await service.define(context)
    expect(children).toMatchObject({
      hello: expect.any(Fn.class)
    })
  })
})
