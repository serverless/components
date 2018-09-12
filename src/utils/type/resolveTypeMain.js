import resolve from 'resolve'

/**
 * @returns {string}
 */
const resolveTypeMain = (typeData, typeRoot) => {
  let { main } = typeData
  if (!main) {
    main = './index.js'
  }

  try {
    return resolve.sync(main, { basedir: typeRoot })
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
    return null
  }
}

export default resolveTypeMain
