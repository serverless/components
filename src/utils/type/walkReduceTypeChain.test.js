import { getTmpDir } from '@serverless/utils'
import { createTestContext } from '../../../test'
import defType from './defType'
import loadType from './loadType'
import walkReduceTypeChain from './walkReduceTypeChain'

describe('#walkReduceTypeChain()', () => {
  test('walk a simple type chain', async () => {
    const root = await getTmpDir()
    const context = await createTestContext()
    const ObjectType = await loadType('Object', context)
    const Type = await defType(
      {
        root,
        props: {
          name: 'Test'
        }
      },
      context
    )

    const result = walkReduceTypeChain(
      (accum, type, keys) => {
        accum.push({
          type,
          keys
        })
        return accum
      },
      [],
      Type
    )

    expect(result).toEqual([
      {
        type: Type,
        keys: []
      },
      {
        type: ObjectType,
        keys: ['parent']
      }
    ])
  })
})
