import { createTestContext } from '../../../test'
import hasType from './hasType'

describe('#hasType()', () => {
  it('should return true for a constructed type', async () => {
    const context = await createTestContext({})
    const ObjectType = await context.import('Object')
    const instance = context.construct(ObjectType, {})
    expect(hasType(instance)).toBe(true)
  })
})
