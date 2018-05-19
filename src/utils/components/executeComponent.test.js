const { assocPath } = require('ramda')
const executeComponent = require('./executeComponent')

describe('#executeComponent()', () => {
  // using our own functions here since Jest mock functions
  // fail the is(Function, func) Ramda check
  const deploy = () => Promise.resolve({ result: 'deployed' })
  const remove = (inputs, context) => {
    if (context.state.RETAIN_STATE) {
      const error = new Error('retain state error')
      error.code = 'RETAIN_STATE'
      return Promise.reject(error)
    }
    return Promise.resolve({ result: 'removed' })
  }
  const rollback = () => Promise.resolve({ result: 'rolled back' })
  const resolve = () => Promise.resolve('resolve')
  const reject = () => Promise.reject(new Error('reject'))

  const componentId = 'myFunction'
  const options = {}
  let components
  let stateFile
  let archive

  beforeEach(() => {
    components = {
      myFunction: {
        id: 'myFunction',
        type: 'aws-lambda',
        inputs: {
          name: 'inputs-function-name',
          memorySize: 512,
          timeout: 60
        },
        inputTypes: {},
        outputs: {},
        outputTypes: {
          result: {
            type: 'string',
            required: true
          }
        },
        state: {},
        dependencies: [],
        children: {},
        promise: {
          resolve,
          reject
        },
        fns: {
          deploy,
          remove,
          rollback
        }
      }
    }
    stateFile = {
      $: {
        serviceId: 'AsH3gefdfDSY'
      },
      myFunction: {
        type: 'aws-lambda',
        state: {
          name: 'state-function-name',
          memorySize: 256,
          timeout: 10
        },
        inputs: {
          name: 'state-inputs-function-name',
          memorySize: 128,
          timeout: 5
        }
      }
    }
    archive = {
      $: {
        serviceId: 'AsH3gefdfDSY'
      },
      myFunction: {
        type: 'aws-lambda',
        state: {
          name: 'archive-function-name',
          memorySize: 128,
          timout: 5
        },
        inputs: {
          name: 'archive-inputs-function-name',
          memorySize: 64,
          timeout: 2
        }
      }
    }
  })

  it('should execute the command on the component if available', async () => {
    const command = 'deploy'
    const res = await executeComponent(
      componentId,
      components,
      stateFile,
      archive,
      command,
      options
    )
    expect(res.executed).toEqual(true)
    expect(res.inputs).toEqual({
      name: 'inputs-function-name',
      memorySize: 512,
      timeout: 60
    })
    expect(res.outputs).toEqual({ result: 'deployed' })
  })

  it('should skip the command execution if the command is not available', async () => {
    const command = 'invalid'
    const res = await executeComponent(
      componentId,
      components,
      stateFile,
      archive,
      command,
      options
    )
    expect(res.executed).toBeFalsy()
    expect(res.inputs).toEqual({
      name: 'inputs-function-name',
      memorySize: 512,
      timeout: 60
    })
    expect(res.outputs).toEqual({})
  })

  it('should treat rollbacks differently', async () => {
    const command = null
    const res = await executeComponent(
      componentId,
      components,
      stateFile,
      archive,
      command,
      options,
      true
    )
    expect(res.executed).toEqual(true)
    expect(res.inputs).toEqual({
      name: 'inputs-function-name',
      memorySize: 512,
      timeout: 60
    })
    expect(res.outputs).toEqual({ result: 'rolled back' })
  })

  it('should throw if outputs do not match output types', async () => {
    const command = 'deploy'
    const deploy = () => Promise.resolve({ invalid: 'type' }) // eslint-disable-line no-shadow
    components = assocPath(['myFunction', 'fns', 'deploy'], deploy, components)

    await expect(
      executeComponent(componentId, components, stateFile, archive, command, options)
    ).rejects.toThrow('Type error(s)')
  })

  describe('when running "remove"', () => {
    const command = 'remove'

    it('should treat removals differently', async () => {
      const res = await executeComponent(
        componentId,
        components,
        stateFile,
        archive,
        command,
        options
      )
      expect(res.executed).toEqual(true)
      expect(res.inputs).toEqual({
        name: 'state-inputs-function-name',
        memorySize: 128,
        timeout: 5
      })
      expect(res.outputs).toEqual({ result: 'removed' })
    })

    it('should skip the command if the state is an empty object', async () => {
      stateFile = assocPath(['myFunction', 'state'], {}, stateFile)

      const res = await executeComponent(
        componentId,
        components,
        stateFile,
        archive,
        command,
        options
      )
      expect(res.executed).toBeFalsy()
      expect(res.inputs).toEqual({
        name: 'state-inputs-function-name',
        memorySize: 128,
        timeout: 5
      })
      expect(res.outputs).toEqual({})
    })

    it('should flush state if remove is resolved', async () => {
      stateFile = assocPath(['myFunction', 'state'], { some: 'state' }, stateFile)

      const res = await executeComponent(
        componentId,
        components,
        stateFile,
        archive,
        command,
        options
      )
      expect(res.executed).toEqual(true)
      expect(res.outputs).toEqual({ result: 'removed' })
      expect(stateFile.myFunction.state).toEqual({})
      stateFile = assocPath(['myFunction', 'state'], {}, stateFile)
    })

    it('should retain state if RETAIN_STATE error is thrown', async () => {
      const retainedState = {
        RETAIN_STATE: true,
        abc: 'xyz'
      }
      stateFile = assocPath(['myFunction', 'state'], retainedState, stateFile)

      const res = await executeComponent(
        componentId,
        components,
        stateFile,
        archive,
        command,
        options
      )
      expect(res.executed).toEqual(true)
      expect(res.outputs).toEqual({})
      expect(stateFile.myFunction.state).toEqual(retainedState)
      stateFile = assocPath(['myFunction', 'state'], {}, stateFile)
    })
  })
})
