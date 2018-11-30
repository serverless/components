import path from 'path'
import { createContext } from '../../../src/utils'

const createTestContext = async () =>
  createContext(
    {
      cwd: path.join(__dirname, '..'),
      overrides: {
        debug: () => {},
        log: () => {}
      }
    },
    {
      app: {
        id: 'test'
      }
    }
  )

describe('App', () => {
  it('should define services and components as children', async () => {
    const context = await createTestContext()
    const inputs = {
      services: {
        hello: {
          type: 'Function',
          inputs: {
            handler: 'index.hello'
          }
        }
      },
      components: {
        cron: {
          type: 'Cron',
          inputs: {
            rate: '3m'
          }
        }
      }
    }

    const App = await context.import('./')
    const app = await context.construct(App, inputs)

    const children = await app.define()

    expect(children).toEqual({
      ...inputs.services,
      ...inputs.components
    })
  })
})
