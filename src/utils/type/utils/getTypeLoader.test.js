import { createTestContext } from '../../../../test'
import getTypeLoader from './getTypeLoader'

describe('#getTypeLoader()', () => {
  it('', async () => {
    const fooLoader = {
      match: jest.fn(() => false)
    }
    const barLoader = {
      match: jest.fn(() => true)
    }
    const context = await createTestContext({
      loaders: {
        fooLoader,
        barLoader
      }
    })
    const testQuery = 'test'
    const result = getTypeLoader(testQuery, context)
    expect(result).toBe(barLoader)
    expect(fooLoader.match).toHaveBeenCalledWith(testQuery)
    expect(barLoader.match).toHaveBeenCalledWith(testQuery)
  })
})
