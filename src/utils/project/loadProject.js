import newProject from './newProject'

const loadProject = async (path, context) => {
  if (!path) {
    throw new Error(
      'Expected a project path, none was supplied. Might need to add the "project" property to options. The project path is where the top level serverless.yml file is located.'
    )
  }

  const Type = await context.import(path)
  const { name } = Type.props
  if (!name) {
    throw new Error('Your serverless.yml project must supply a "name" property')
  }

  return newProject({
    name,
    path,
    Type
  })
}

export default loadProject
