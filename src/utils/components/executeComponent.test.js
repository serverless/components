const executeComponent = require('./executeComponent')

describe('#executeComponent()', () => {
  // using our own functions here since Jest mock functions
  // fail the is(Function, func) Ramda check
  const deploy = () => Promise.resolve({ result: 'deployed' })
  const remove = () => Promise.resolve({ result: 'removed' })
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
        outputs: {},
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
        serviceId: 'AsH3gefdfDSY' // AsH3gefdfDSY-cHA9jPi5lPQj
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

  it('should treat removals differently', async () => {
    const command = 'remove'
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
})
