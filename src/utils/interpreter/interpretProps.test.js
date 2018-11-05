import { createTestContext } from '../../../test'
import interpretProps from './interpretProps'

describe('#interpretProps()', () => {
  let context

  beforeEach(async () => {
    context = await createTestContext()
  })

  it('should not interpret inputTypes', async () => {
    const interpretedProps = await interpretProps(
      {
        inputTypes: {
          prop: '${test}'
        }
      },
      { test: 'foo' },
      context
    )

    expect(interpretedProps).toEqual({
      inputTypes: {
        prop: '${test}'
      }
    })
  })

  it('should interpret variables', async () => {
    const data = { test: 'foo' }
    const interpretedProps = await interpretProps(
      {
        foo: {
          prop: '${test}'
        }
      },
      data,
      context
    )

    expect(interpretedProps).toEqual({
      foo: {
        prop: expect.objectContaining({
          data,
          variableString: '${test}'
        })
      }
    })
  })
})
