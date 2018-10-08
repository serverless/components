import { pick } from '@serverless/utils'

const newProject = (props) => {
  const project = pick(['name', 'path', 'Type'], props)

  return project
}

export default newProject
