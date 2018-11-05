import { keys, omit, or, pick, union } from '@serverless/utils'
import { walkReduceTypeChain } from '../../../../src/utils'

const pickComponentProps = (component) => {
  const props = walkReduceTypeChain(
    (accum, Type) => union(accum, keys(or(Type.props, {}))),
    ['inputs'],
    component.getType()
  )

  return omit(['components', 'inputTypes'], pick(props, component))
}

export default pickComponentProps
