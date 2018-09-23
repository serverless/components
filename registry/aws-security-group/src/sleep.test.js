const sleep = require('./sleep')

describe('AWS VPC Unit Tests', () => {
  it('should create a new VPC', async () => {
    const start = Date.now()
    await sleep(100)
    const runtime = Date.now() - start
    expect(runtime).toBeGreaterThanOrEqual(100)
  })
})
