import errorReentrantTypeLoad from '../errors/errorReentrantTypeLoad'

const LOADING_TYPE_MAINS = new Set()

const requireTypeMain = (name) => {
  if (LOADING_TYPE_MAINS.has(name)) {
    throw errorReentrantTypeLoad(name)
  }

  try {
    LOADING_TYPE_MAINS.add(name)
    const required = require(name)
    return required.default || required
  } finally {
    LOADING_TYPE_MAINS.delete(name)
  }
}

export default requireTypeMain
