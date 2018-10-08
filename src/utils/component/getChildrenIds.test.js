import getChildrenIds from './getChildrenIds'

describe('#getChildrenIds()', () => {
  it('should return the components children ids', () => {
    const component = {
      children: {
        childA: {
          id: 'sub-component-a'
        },
        childB: {
          id: 'sub-component-b'
        }
      }
    }

    expect(getChildrenIds(component)).toEqual({
      childA: 'sub-component-a',
      childB: 'sub-component-b'
    })
  })

  it('should return an empty object if no children ids can be found', () => {
    const component = {}
    expect(getChildrenIds(component)).toEqual({})
  })
})
