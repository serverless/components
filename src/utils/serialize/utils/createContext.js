const createContext = (context = {}) => ({
  refNumber: 0,
  referenceKeys: new WeakMap(),
  symbolMap: {},
  ...context
})

export default createContext
