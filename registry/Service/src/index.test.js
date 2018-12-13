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
  let context
  let Service

  beforeEach(async () => {
    context = await createTestContext()
    Service = await context.import('Service')
  })

  describe('#construct()', () => {
    it('should default components and functions to empty objects', async () => {
      const service = await context.construct(Service, {})

      expect(resolve(service.components)).toEqual({})
      expect(resolve(service.functions)).toEqual({})
    })

    it('should construct function instances', async () => {
      const Function = await context.import('Function')

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

    it('should creaate component instances', async () => {
      const Component = await context.import('Component')
      const component1 = await context.construct(Component, {})

      const service = await context.construct(Service, {
        components: {
          component1,
          component2: {
            type: './', // Service is of type Component
            inputs: {}
          }
        }
      })

      expect(service.components.component1).toBeInstanceOf(Component.class)
      expect(service.components.component2).toBeInstanceOf(Component.class)
    })

    it('should throw if type is not a component', async () => {
      await expect(
        context.construct(Service, {
          components: {
            component: {
              type: '../Object', // Object is not of type Component
              inputs: {}
            }
          }
        })
      ).rejects.toThrow('is not of type Component')
    })

    it('should throw if component definition is invalid', async () => {
      await expect(
        context.construct(Service, {
          components: {
            component: {}
          }
        })
      ).rejects.toThrow('is invalid')
    })
  })

  describe('#define()', () => {
    it('should define functions as instances', async () => {
      const Function = await context.import('Function')

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
        hello: expect.any(Function.class)
      })
    })
  })

  describe('#info()', () => {
    it('should return the service info', async () => {
      const Component = await context.import('Component')
      const component = await context.construct(Component, {})

      const service = await context.construct(Service, {
        functions: {
          hello: {
            functionName: 'hello',
            code: './code',
            handler: 'index.hello'
          }
        },
        components: {
          component
        }
      })

      const info = await service.info()
      expect(info.title).toEqual('Service')
      expect(info.type).toEqual('Service')
      expect(info.data).toEqual({})
      const children = info.children.sort((first, second) => first.type.localeCompare(second.type))
      expect(children).toHaveLength(2)
      expect(children[0].type).toEqual('Component')
      expect(children[1].type).toEqual('Function')
    })
  })
})
