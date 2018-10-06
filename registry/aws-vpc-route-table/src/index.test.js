// aws-vpc-route-table
const myComponent = require('./index')

describe('aws-vpc-route-table Unit Tests', () => {
  it('should have tests', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }
    await myComponent.deploy({}, contextMock)
    expect(false).toBe(true)
  })
})
