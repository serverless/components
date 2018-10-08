import newApp from './newApp'

const loadApp = async (id, project) => {
  return newApp({
    id,
    project
  })
}

export default loadApp
