const handleSignalEvents = require('./handleSignalEvents')

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#handleSignalEvents()', () => {
  let oldProcess
  let oldConsole
  let exitMock
  let logMock

  beforeEach(() => {
    oldProcess = process
    oldConsole = console
    exitMock = jest.fn()
    logMock = jest.fn()
    global.process = oldProcess
    global.console = oldConsole
    global.process.exit = exitMock
    global.console.log = logMock
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.process = oldProcess
    global.console = oldConsole
  })

  describe('when dealing with SIGINT events', () => {
    let getSIGINTCount
    let getGracefulExitStatus
    const SIGNAL = 'SIGINT'

    beforeEach(() => {
      process.removeAllListeners([ SIGNAL ])
      const res = handleSignalEvents()
      getSIGINTCount = res.getSIGINTCount
      getGracefulExitStatus = res.getGracefulExitStatus
    })

    it('should ask for a confirmation (emitting signal a second time) before exiting', (done) => {
      process.on(SIGNAL, () => {
        const SIGINTCount = getSIGINTCount()
        const gracefulExitStatus = getGracefulExitStatus()
        expect(logMock).toHaveBeenCalledTimes(1)
        expect(exitMock).not.toHaveBeenCalled()
        expect(SIGINTCount).toEqual(1)
        expect(gracefulExitStatus).toEqual(true)
        done()
      })
      process.emit(SIGNAL)
    })

    it('should exit the process after receiving the second signal', (done) => {
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 2) {
          const SIGINTCount = getSIGINTCount()
          const gracefulExitStatus = getGracefulExitStatus()
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).toHaveBeenCalled()
          expect(SIGINTCount).toEqual(2)
          expect(gracefulExitStatus).toEqual(false)
          done()
        }
      })
      process.emit(SIGNAL, 1)
      process.emit(SIGNAL, 2)
    })

    it('should support windows systems', (done) => {
      process.platform = 'win32'
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 2) {
          const SIGINTCount = getSIGINTCount()
          const gracefulExitStatus = getGracefulExitStatus()
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).toHaveBeenCalled()
          expect(SIGINTCount).toEqual(2)
          expect(gracefulExitStatus).toEqual(false)
          done()
        }
      })
      process.emit(SIGNAL, 1)
      process.emit(SIGNAL, 2)
    })
  })
})
