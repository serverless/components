import { getTmpDir } from '@serverless/utils'
import { createTestContext } from '../../../test'
import defType from './defType'
import loadType from './loadType'

describe('#defType()', () => {
  it('should default to Object as the parent type if extends property is not set', async () => {
    const root = await getTmpDir()
    const context = await createTestContext()
    const type = {
      root,
      props: {
        name: 'Test'
      }
    }
    const ObjectType = await loadType('Object', context)
    const Type = await defType(type, context)
    expect(Type).toEqual({
      class: expect.any(Function),
      constructor: expect.any(Function),
      main: expect.any(Function),
      parent: ObjectType,
      props: {
        extends: 'Object',
        name: 'Test'
      },
      root
    })
  })
})
