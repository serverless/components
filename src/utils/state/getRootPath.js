import { resolve } from 'path'

const getRootPath = (stateFile, componentId) => {
  if (stateFile[componentId] && stateFile[componentId].rootPath) {
    return resolve(stateFile[componentId].rootPath)
  }
  return null
}

export default getRootPath
