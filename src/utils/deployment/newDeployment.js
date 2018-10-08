import { pick } from '@serverless/utils'

const newDeployment = (props) => {
  return pick(['app', 'id', 'path'], props)
}

export default newDeployment
