import { get, mix } from '@serverless/utils'
import Base from './Base'

const buildTypeClass = async (type, context) => {
  const { main, props, parent } = type
  const ParentClass = get('constructor', parent) || Base
  const Class = await mix(ParentClass, context).with(main)
  Object.defineProperty(Class, 'name', { value: props.name })
  return Class
}

export default buildTypeClass
