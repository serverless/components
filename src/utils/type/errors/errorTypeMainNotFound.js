import { error } from '@serverless/utils'

const errorTypeMainNotFound = (name, root, main) =>
  error(`
  Could not find the main file ${main} of type ${name}.
  Looked in ${root} but couldn't find a main entry that resolved to a file or a built in index file`)

export default errorTypeMainNotFound
