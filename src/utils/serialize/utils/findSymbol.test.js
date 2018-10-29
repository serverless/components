import findSymbol from './findSymbol'

describe('findSymbol', () => {
  it('find a symbol', () => {
    const symFoo = Symbol('foo')
    const context = {
      log: () => {},
      symbolMap: {
        [symFoo]: '@@foo'
      }
    }
    expect(findSymbol(context, '@@foo')).toEqual(symFoo)
  })
})
