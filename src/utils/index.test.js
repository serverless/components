describe('index', () => {
  test('require runs without error', () => {
    expect(() => {
      require('./')
    }).not.toThrow()
  })

  test('has context methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      createContext: expect.any(Function),
      newContext: expect.any(Function)
    })
  })

  test('has log methods', () => {
    const mod = require('./')
    expect(mod).toMatchObject({
      log: expect.any(Function)
    })
  })
})
