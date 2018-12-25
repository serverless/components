import { find } from '@serverless/utils'

const getTypeLoader = (query, context) => {
  const { loaders } = context

  let typeLoader = find((loader) => loader.match(query), loaders)
  if (!typeLoader) {
    // NOTE BRN: path is the default loader
    typeLoader = loaders['path']
  }
  return typeLoader
}

export default getTypeLoader
