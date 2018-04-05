const handleSignalEvents = require('./handleSignalEvents')

const log = jest.spyOn(console, 'log')

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#handleSignalEvents()', () => {
  let oldProcess
  let exitMock

  beforeEach(() => {
    oldProcess = process
    exitMock = jest.fn()
    global.process = oldProcess
    global.process.exit = exitMock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(() => {
    global.process = oldProcess
  })

  describe('when dealing with SIGINT events', () => {
    const SIGNAL = 'SIGINT'

    it('should ask for a confirmation (emitting signal a second time) before exiting', (done) => {
      handleSignalEvents()

      process.once(SIGNAL, () => {
        expect(log).toHaveBeenCalledTimes(1)
        expect(exitMock).not.toHaveBeenCalled()
        done()
      })
      process.emit(SIGNAL)
    })

    it('should exit the process after receiving the second signal', (done) => {
      handleSignalEvents()

      process.once(SIGNAL, () => {
        expect(log).toHaveBeenCalledTimes(1)
        expect(exitMock).toHaveBeenCalled()
        done()
      })
      process.emit(SIGNAL)
      process.emit(SIGNAL)
    })

    it('should support windows systems', (done) => {
      handleSignalEvents()

      process.platform = 'win32'
      process.once(SIGNAL, () => {
        expect(log).toHaveBeenCalledTimes(1)
        expect(exitMock).toHaveBeenCalled()
        done()
      })
      process.emit(SIGNAL)
      process.emit(SIGNAL)
    })
  })
})
