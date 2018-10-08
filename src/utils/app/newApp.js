import { pick } from '@serverless/utils'

const newApp = (props) => {
  return pick(['id', 'project'], props)
}

export default newApp
