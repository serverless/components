import errorReentrantTypeLoad from './errorReentrantTypeLoad'

const LOADING_TYPE_MAINS = new Set()

const requireTypeMain = (name) => {
  if (LOADING_TYPE_MAINS.has(name)) {
    throw errorReentrantTypeLoad(name)
  }

  try {
    LOADING_TYPE_MAINS.add(name)
    return require(name)
  } finally {
    LOADING_TYPE_MAINS.delete(name)
  }
}

export default requireTypeMain
