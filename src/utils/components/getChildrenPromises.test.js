const getChildrenPromises = require('./getChildrenPromises')

describe('#getChildrenPromises()', () => {
  const component = {
    children: {
      childA: 'sub-component-a',
      childB: 'sub-component-b'
    }
  }
  const components = {
    'sub-component-a': {
      promise: {
        reject: 'reject-a',
        resolve: 'resolve-a'
      }
    },
    'sub-component-b': {
      promise: {
        reject: 'reject-b',
        resolve: 'resolve-b'
      }
    }
  }

  it('should return the childrens Promises', async () => {
    const res = getChildrenPromises(component, components)

    expect(res).toEqual({
      childA: {
        reject: 'reject-a',
        resolve: 'resolve-a'
      },
      childB: {
        reject: 'reject-b',
        resolve: 'resolve-b'
      }
    })
  })
})
