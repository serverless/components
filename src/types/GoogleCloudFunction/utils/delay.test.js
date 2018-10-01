const delay = require('./delay')

jest.useFakeTimers()

describe('#delay()', () => {
  it('should asynchronously delay based on the given time', async () => {
    const promise = delay(2000)
    jest.runAllTimers()
    await promise

    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 2000)
  })
})
