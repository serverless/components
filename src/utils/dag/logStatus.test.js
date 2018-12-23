import logStatus from './logStatus'
import { createTestContext } from '../../../test'

describe('#logStatus()', () => {
  let iteratee
  let mockLog
  let context
  const state = {}

  beforeEach(async () => {
    iteratee = {}
    mockLog = jest.fn()
    context = await createTestContext({ cwd: __dirname })
    context.log = mockLog
  })

  it('should log the current status when deploying', () => {
    iteratee.name = 'deployNode'
    const node = {
      nextInstance: {
        constructor: {
          name: 'SomeService'
        },
        inputs: {
          name: 'some-name'
        },
        inputTypes: {
          name: {
            type: 'string',
            required: true
          }
        }
      }
    }
    logStatus(iteratee, node, context)

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog.mock.calls[0][0]).toMatch(/Deploying.*with parameters.*/)
  })

  it('should log the current status when removing', () => {
    iteratee.name = 'removeNode'
    const node = {
      prevInstance: {
        constructor: {
          name: 'SomeService'
        },
        inputs: {
          name: 'some-name'
        },
        inputTypes: {
          name: {
            type: 'string',
            required: true
          }
        }
      }
    }
    logStatus(iteratee, node, context)

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog.mock.calls[0][0]).toMatch(/Removing.*with parameters.*/)
  })

  it('should be able to deal with node instances without inputs defined', () => {
    iteratee.name = 'deployNode'
    const node = {
      nextInstance: {
        constructor: {
          name: 'SomeService'
        }
      },
      prevInstance: {
        constructor: {
          name: 'SomeService'
        }
      }
    }
    logStatus(iteratee, node, context)

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog.mock.calls[0][0]).toEqual('Deploying "SomeService" ')
  })

  it('should not log any status if the operation is unknown', () => {
    iteratee.name = 'UNKNOWN_OPERATION'
    const node = {
      nextInstance: {
        constructor: {
          name: 'SomeService'
        }
      },
      prevInstance: {
        constructor: {
          name: 'SomeService'
        }
      }
    }
    logStatus(iteratee, node, context)

    expect(mockLog).toHaveBeenCalledTimes(0)
  })

  it('should not log deeply nested / circular structured objects', async () => {
    const Provider = await context.import('Provider')
    const provider = context.construct(Provider, state, context)

    iteratee.name = 'deployNode'
    const node = {
      nextInstance: {
        constructor: {
          name: 'SomeService'
        },
        inputs: {
          provider: provider
        },
        inputTypes: {
          provider: {
            type: 'Provider',
            required: true
          }
        }
      }
    }
    logStatus(iteratee, node, context)

    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog.mock.calls[0][0]).toMatch('Deploying "SomeService" ')
  })
})
