import Function from './index'

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Function', () => {
  it('should call defineFunction on compute', async () => {
    const scope = {
      compute: {
        defineFunction: jest.fn().mockReturnValue({ functionName: 'hello' })
      }
    }

    const expectedChildren = {
      fn: {
        functionName: 'hello'
      }
    }

    const children = await Function.define.call(scope, {})
    expect(scope.compute.defineFunction).toBeCalledWith(scope, {})
    expect(children).toEqual(expectedChildren)
  })
  it('should return child function id', () => {
    const scope = {
      children: {
        fn: {
          getId: jest.fn().mockReturnValue('some:arn:here')
        }
      }
    }

    const id = Function.getId.call(scope)
    expect(id).toEqual('some:arn:here')
    expect(scope.children.fn.getId).toBeCalled()
  })
})
