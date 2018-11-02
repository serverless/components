import { createContext } from '../src'

const createTestContext = async (options = {}, context = {}) =>
  createContext(
    {
      cwd: process.cwd(),
      overrides: {
        debug: () => {},
        log: () => {}
      },
      ...options
    },
    {
      app: {
        id: 'test'
      },
      ...context
    }
  )

export default createTestContext
