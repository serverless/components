const compareInputsToState = require('./compareInputsToState')

describe('#compareInputsToState()', () => {
  it('should return hasState false', () => {
    const inputs = {
      name: 'Server Less'
    }
    const state = {}
    const res = compareInputsToState(inputs, state)
    expect(res.hasState).toEqual(false)
    // run create flow
  })
  it('should return equality', () => {
    const inputs = {
      name: 'Server Less'
    }
    const state = {
      name: 'Server Less'
    }
    const res = compareInputsToState(inputs, state)
    expect(res.hasState).toEqual(true)
    expect(res.isEqual).toEqual(true)
    expect(res.keys.length).toEqual(0)
    expect(Object.keys(res.diffs).length).toEqual(0)
    // run noOp flow
  })
  it('should return diffs', () => {
    const inputs = {
      name: 'Server Less'
    }
    const state = {
      name: 'Serverless'
    }
    const res = compareInputsToState(inputs, state)
    expect(res.hasState).toEqual(true)
    expect(res.isEqual).toEqual(false)
    expect(res.keys.length).toEqual(1)
    expect(res.keys[0]).toEqual('name')
  })
  it('should return diffs on multiple keys', () => {
    const inputs = {
      name: '⊂◉‿◉つ',
      yolo: true
    }
    const state = {
      name: 'old value',
      yolo: false
    }
    const res = compareInputsToState(inputs, state)
    expect(res.hasState).toEqual(true)
    expect(res.isEqual).toEqual(false)
    expect(res.keys.length).toEqual(2)
    expect(res.keys[0]).toEqual('name')
    expect(res.keys[1]).toEqual('yolo')
  })
})
