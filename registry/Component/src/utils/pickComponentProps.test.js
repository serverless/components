import { omit } from '@serverless/utils'
import path from 'path'
import { createTestContext } from '../../../../test'
import pickComponentProps from './pickComponentProps'

describe('pickComponentProps', () => {
  const cwd = path.resolve(__dirname, '../..')
  let context
  let Component

  it('picks inputs from an empty component', async () => {
    context = await createTestContext({ cwd })
    Component = await context.import('Component')

    const inputs = {
      foo: 'bar'
    }
    const component = await context.construct(Component, inputs)

    expect(pickComponentProps(component)).toEqual(
      omit(['components', 'inputTypes'], {
        ...Component.props,
        inputs
      })
    )
  })
})
