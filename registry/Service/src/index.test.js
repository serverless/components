import Service from './index'

const Fn = {
  functionName: 'hello',
  class: true
}

const fn = {
  functionName: 'hello',
  instance: true
}

class SuperClass {
  async construct(inputs) {
    this.functions = inputs.functions
  }
}

const SuperContext = {
  loadType: async () => Fn
}

const context = {
  construct: jest.fn().mockReturnValue(fn)
}

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Service', () => {
  it('should create function instances', async () => {
    const inputs = {
      functions: {
        hello: {
          functionName: 'hello'
        }
      }
    }
    let service = await Service(SuperClass, SuperContext)
    service = new service()
    await service.construct(inputs, context)

    expect(context.construct).toBeCalledWith(Fn, { functionName: 'hello' })
    expect(service.functions.hello).toEqual(fn)
  })

  it('should define functions and components as instances', async () => {
    const scope = {
      functions: {
        hello: {
          functionName: 'hello'
        }
      },
      components: {
        myComponent: {
          name: 'myComponent'
        }
      }
    }
    let service = await Service(SuperClass, SuperContext)
    service = new service()

    const children = await service.define.call(scope)
    expect(children).toEqual({
      ...scope.functions,
      ...scope.components
    })
  })
})
