const getChildrenIds = require('./getChildrenIds')

describe('#getChildrenIds()', () => {
  it('should return the components children ids', () => {
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
    const res = getChildrenIds(component)
    expect(res).toEqual({ childA: 'sub-component-a', childB: 'sub-component-b' })
  })

  it('should return an empty object if no children ids can be found', () => {
    const component = {}
    const res = getChildrenIds(component)
    expect(res).toEqual({})
  })
})
