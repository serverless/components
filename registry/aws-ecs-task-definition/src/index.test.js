const AWS = require('aws-sdk')
const component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    registerTaskDefinitionMock: jest.fn(({ family }) => ({
      taskDefinition: {
        family,
        revision: 1
      }
    })),
    describeTaskDefinitionMock: jest.fn(({ taskDefinition: familyAndRevision }) => {
      const splits = familyAndRevision.split(':').filter((el) => el.length)
      return {
        taskDefinition: {
          family: splits.slice(0, splits.length - 1).join(':'),
          revision: 1
        }
      }
    }),
    deregisterTaskDefinitionMock: jest.fn().mockResolvedValue({})
  }

  const ECS = {
    registerTaskDefinition: (obj) => ({
      promise: () => mocks.registerTaskDefinitionMock(obj)
    }),
    deregisterTaskDefinition: (obj) => ({
      promise: () => mocks.deregisterTaskDefinitionMock(obj)
    }),
    describeTaskDefinition: (obj) => ({
      promise: () => mocks.describeTaskDefinitionMock(obj)
    })
  }
  return {
    mocks,
    ECS: jest.fn().mockImplementation(() => ECS)
  }
})

afterEach(() => {
  Object.keys(AWS.mocks).forEach((mock) => AWS.mocks[mock].mockClear())
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AWS ECS TaskDefinition Unit Tests', () => {
  it('should register a task definition', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      family: 'myTask'
    }

    const { family, revision } = await component.deploy(inputs, contextMock)

    expect(family).toBe(inputs.family)
    expect(revision).toBe(1)
    expect(AWS.mocks.registerTaskDefinitionMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deregisterTaskDefinitionMock).toHaveBeenCalledTimes(0)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })

  it('should update the task definition name', async () => {
    const contextMock = {
      state: {
        family: 'myTaskOlder',
        revision: 1
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      family: 'myTask'
    }

    const { family } = await component.deploy(inputs, contextMock)

    expect(family).toBe(inputs.family)
    expect(AWS.mocks.registerTaskDefinitionMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deregisterTaskDefinitionMock).toHaveBeenCalledTimes(2)
    expect(contextMock.saveState).toHaveBeenCalledTimes(3)
  })

  it('should deregister the task definition', async () => {
    const contextMock = {
      state: {
        family: 'myTask',
        revision: 1
      },
      log: () => {},
      saveState: jest.fn()
    }

    await component.remove({}, contextMock)

    expect(AWS.mocks.registerTaskDefinitionMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deregisterTaskDefinitionMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
})
