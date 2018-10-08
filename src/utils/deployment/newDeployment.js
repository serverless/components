import { pick } from '@serverless/utils'

const newDeployment = (props) => {
  return pick(['app', 'id', 'number'], props)
}

export default newDeployment
