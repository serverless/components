import createContext from '../context/createContext'
import isComponent from './isComponent'

describe('#isComponent()', () => {
  it('returns true for Component instance', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const component = await context.construct(Component, {})
    expect(isComponent(component)).toBe(true)
  })

  it('returns true for anything with construct, define, deploy and remove methods', async () => {
    expect(
      isComponent({ construct: () => {}, define: () => {}, deploy: () => {}, remove: () => {} })
    ).toBe(true)
  })

  test('returns false for all other values', () => {
    expect(isComponent(undefined)).toBe(false)
    expect(isComponent(null)).toBe(false)
    expect(isComponent('')).toBe(false)
    expect(isComponent('abc')).toBe(false)
    expect(isComponent(false)).toBe(false)
    expect(isComponent(true)).toBe(false)
    expect(isComponent(0)).toBe(false)
    expect(isComponent(-1)).toBe(false)
    expect(isComponent(1)).toBe(false)
    expect(isComponent(NaN)).toBe(false)
    expect(isComponent(Infinity)).toBe(false)
    expect(isComponent(-Infinity)).toBe(false)
    expect(isComponent(new Date())).toBe(false)
    expect(isComponent(/.*/)).toBe(false)
    expect(isComponent([])).toBe(false)
    expect(isComponent({})).toBe(false)
    expect(isComponent(() => {})).toBe(false)
  })
})
