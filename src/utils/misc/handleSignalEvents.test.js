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

  describe('when dealing with a SIGINT signal', () => {
    const SIGNAL = 'SIGINT'

    beforeEach(() => {
      process.removeAllListeners([SIGNAL])
    })

    it('should ask for a confirmation (emitting signal a second time) before exiting', (done) => {
      handleSignalEvents()
      process.on(SIGNAL, () => {
        expect(logMock).toHaveBeenCalledTimes(1)
        expect(exitMock).not.toHaveBeenCalled()
        expect(global.signalEventHandling.SIGINTCount).toEqual(1)
        expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
        done()
      })
      process.emit(SIGNAL)
    })

    it('should exit the process after receiving the second signal', (done) => {
      handleSignalEvents()
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 2) {
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).toHaveBeenCalled()
          expect(global.signalEventHandling.SIGINTCount).toEqual(2)
          expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
          done()
        }
      })
      process.emit(SIGNAL, 1)
      process.emit(SIGNAL, 2)
    })

    it('should support windows systems', (done) => {
      handleSignalEvents()
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      })
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 2) {
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).toHaveBeenCalled()
          expect(global.signalEventHandling.SIGINTCount).toEqual(2)
          expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
          done()
        }
      })
      process.emit(SIGNAL, 1)
      process.emit(SIGNAL, 2)
    })
  })

  describe('when dealing with a SIGTERM signal', () => {
    const SIGNAL = 'SIGTERM'

    beforeEach(() => {
      process.removeAllListeners([SIGNAL])
    })

    it('should exit the process after receiving the signal', (done) => {
      handleSignalEvents()
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 1) {
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).not.toHaveBeenCalled()
          expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
          done()
        }
      })
      process.emit(SIGNAL, 1)
    })

    it('should support windows systems', (done) => {
      handleSignalEvents()
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      })
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 1) {
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).not.toHaveBeenCalled()
          expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
          done()
        }
      })
      process.emit(SIGNAL, 1)
    })
  })

  describe('when dealing with a SIGBREAK signal', () => {
    const SIGNAL = 'SIGBREAK'

    beforeEach(() => {
      process.removeAllListeners([SIGNAL])
    })

    it('should exit the process after receiving the signal', (done) => {
      handleSignalEvents()
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 1) {
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).not.toHaveBeenCalled()
          expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
          done()
        }
      })
      process.emit(SIGNAL, 1)
    })

    it('should support windows systems', (done) => {
      handleSignalEvents()
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      })
      process.on(SIGNAL, (numEmitted) => {
        if (numEmitted === 1) {
          expect(logMock).toHaveBeenCalledTimes(1)
          expect(exitMock).not.toHaveBeenCalled()
          expect(global.signalEventHandling.shouldExitGracefully).toEqual(true)
          done()
        }
      })
      process.emit(SIGNAL, 1)
    })
  })
})
