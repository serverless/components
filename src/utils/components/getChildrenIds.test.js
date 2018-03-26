const getChildrenIds = require('./getChildrenIds')

describe('#getChildrenIds()', () => {
  const component = {
    components: {
      childA: {
        id: 'sub-component-a'
      },
      childB: {
        id: 'sub-component-b'
      }
    }
  }

  it('should return the components children ids', () => {
    const res = getChildrenIds(component)
    expect(res).toEqual({ childA: 'sub-component-a', childB: 'sub-component-b' })
  })
})
