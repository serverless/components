import App from './index'

class SuperClass {
  constructor(inputs) {
    this.services = inputs.services
    this.components = inputs.components
  }
}

describe('App', () => {
  it('should define services and components as children', async () => {
    const inputs = {
      services: {
        users: {
          name: 'users'
        }
      },
      components: {
        cron: {
          name: 'cron'
        }
      }
    }
    let app = await App(SuperClass, {})
    app = new app(inputs)

    const children = await app.define()

    expect(children).toEqual({
      ...inputs.services,
      ...inputs.components
    })
  })
})
