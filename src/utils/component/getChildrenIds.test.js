import getChildrenIds from './getChildrenIds'

describe('#getChildrenIds()', () => {
  it('should return the components children ids in an array from an object', () => {
    const component = {
      children: {
        childA: {
          instanceId: 'sub-component-a'
        },
        childB: {
          instanceId: 'sub-component-b',
          childC: {
            instanceId: 'sub-component-c',
            childD: {
              instanceId: 'sub-component-d'
            }
          }
        },
        childE: {
          instanceId: 'sub-component-e'
        }
      }
    }

    expect(getChildrenIds(component)).toEqual([
      'sub-component-a',
      'sub-component-b',
      'sub-component-c',
      'sub-component-d',
      'sub-component-e'
    ])
  })

  it('should return the components children ids in an array from an array', () => {
    const component = {
      children: [
        {
          instanceId: 'sub-component-a'
        },
        {
          childB: {
            instanceId: 'sub-component-b',
            childC: {
              instanceId: 'sub-component-c'
            }
          }
        },
        {
          instanceId: 'sub-component-d'
        }
      ]
    }

    expect(getChildrenIds(component)).toEqual([
      'sub-component-a',
      'sub-component-b',
      'sub-component-c',
      'sub-component-d'
    ])
  })

  it('should return an empty array if no children ids can be found in an children object', () => {
    const component = {
      children: {}
    }
    expect(getChildrenIds(component)).toEqual([])
  })

  it('should return an empty array if no children ids can be found in an array', () => {
    const component = {
      children: []
    }
    expect(getChildrenIds(component)).toEqual([])
  })

  it('should return an empty array if children is undefined', () => {
    const component = {}
    expect(getChildrenIds(component)).toEqual([])
  })
})
