describe('index', () => {
  test('require runs without error', () => {
    expect(() => {
      require('./')
    }).not.toThrow()
  })

  test('has expected methods', () => {
    const mod = require('./')
    expect(mod).toEqual({
      createContext: expect.any(Function),
      walkReduceTypeChain: expect.any(Function),
      SYMBOL_TYPE: expect.anything(),

      run: expect.any(Function),
      start: expect.any(Function),

      deploy: expect.any(Function),
      info: expect.any(Function),
      package: expect.any(Function),
      remove: expect.any(Function)
    })
  })
})
