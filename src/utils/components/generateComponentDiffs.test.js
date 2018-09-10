const generateComponentDiffs = require('./generateComponentDiffs')

describe('#generateComponentDiffs()', () => {
  it('should show no change and use null', () => {
    const previousInputs = {
      foo: 'bar'
    }
    const newInputs = {
      foo: 'bar'
    }
    const results = generateComponentDiffs(previousInputs, newInputs)
    expect(results).toBeNull()
  })

  it('should show a string update', () => {
    const previousInputs = {
      foo: 'bar'
    }
    const newInputs = {
      foo: 'buzz'
    }
    const results = generateComponentDiffs(previousInputs, newInputs)

    expect(results[0].change).toEqual('update')
    expect(results[0].path).toEqual(['foo'])
    expect(results[0].previous).toEqual('bar')
    expect(results[0].current).toEqual('buzz')
    expect(results[1]).toBeUndefined()
  })

  it('should show an object update', () => {
    const previousInputs = {
      foo: {
        fizz: 'buzz'
      }
    }
    const newInputs = {
      foo: {
        fizz: 'bizz'
      }
    }
    const results = generateComponentDiffs(previousInputs, newInputs)
    expect(results[0].change).toEqual('update')
    expect(results[0].path).toEqual(['foo', 'fizz'])
    expect(results[0].previous).toEqual('buzz')
    expect(results[0].current).toEqual('bizz')
    expect(results[1]).toBeUndefined()
  })

  it('should show a property create', () => {
    const previousInputs = {
      foo: {}
    }
    const newInputs = {
      foo: {
        fizz: 'bizz'
      }
    }
    const results = generateComponentDiffs(previousInputs, newInputs)

    expect(results[0].change).toEqual('create')
    expect(results[0].path).toEqual(['foo', 'fizz'])
    expect(results[0].previous).toBeNull()
    expect(results[0].current).toEqual('bizz')
    expect(results[1]).toBeUndefined()
  })

  it('should show a property delete', () => {
    const previousInputs = {
      foo: {
        fizz: 'bizz'
      }
    }
    const newInputs = {
      foo: {}
    }
    const results = generateComponentDiffs(previousInputs, newInputs)

    expect(results[0].change).toEqual('delete')
    expect(results[0].path).toEqual(['foo', 'fizz'])
    expect(results[0].previous).toEqual('bizz')
    expect(results[0].current).toBeNull()
    expect(results[1]).toBeUndefined()
  })

  it('should show an array_update with create', () => {
    const previousInputs = {
      foo: []
    }
    const newInputs = {
      foo: [
        {
          fizz: 'bizz'
        }
      ]
    }
    const results = generateComponentDiffs(previousInputs, newInputs)

    expect(results[0].change).toEqual('update_array')
    expect(results[0].path).toEqual(['foo'])
    expect(results[0].previous).toBeNull()
    expect(results[0].current).toBeNull()
    expect(results[0].item.change).toEqual('create')
    expect(results[1]).toBeUndefined()
  })

  it('should show an array_update with delete', () => {
    const previousInputs = {
      foo: [
        {
          fizz: 'bizz'
        }
      ]
    }
    const newInputs = {
      foo: []
    }
    const results = generateComponentDiffs(previousInputs, newInputs)

    expect(results[0].change).toEqual('update_array')
    expect(results[0].path).toEqual(['foo'])
    expect(results[0].previous).toBeNull()
    expect(results[0].current).toBeNull()
    expect(results[0].item.change).toEqual('delete')
    expect(results[1]).toBeUndefined()
  })

  it('should show an update', () => {
    const previousInputs = {
      foo: [
        {
          fizz: 'bizz'
        }
      ]
    }
    const newInputs = {
      foo: [
        {
          fizz: 'buzz'
        }
      ]
    }
    const results = generateComponentDiffs(previousInputs, newInputs)

    expect(results[0].change).toEqual('update')
    expect(results[0].path).toEqual(['foo', 0, 'fizz'])
    expect(results[0].previous).toEqual('bizz')
    expect(results[0].current).toEqual('buzz')
    expect(results[1]).toBeUndefined()
  })
})
