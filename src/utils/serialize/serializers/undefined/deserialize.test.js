import { forEach } from '@serverless/utils'
import { deserializeTypeError } from '../../errors'
import deserialize from './deserialize'

describe('deserialize', () => {
  it('deserializes an serialized undefined', async () => {
    expect(await deserialize({ type: 'undefined' })).toBe(undefined)
  })

  it('Throws a DeserializeTypeError when the wrong serialized type is received', async () => {
    const check = async () => deserialize({ type: 'null' })
    await expect(check()).rejects.toThrow(
      expect.objectContaining({
        type: deserializeTypeError.TYPE
      })
    )
  })

  it('Throws a DeserializeTypeError when bad values are received', async () => {
    const testBadValue = async (value) => {
      const check = async () => deserialize(value)
      await expect(check()).rejects.toThrow(
        expect.objectContaining({
          type: deserializeTypeError.TYPE
        })
      )
    }

    return forEach(testBadValue, [
      undefined,
      null,
      '',
      'abc',
      false,
      true,
      0,
      -1,
      1,
      NaN,
      Infinity,
      -Infinity,
      {},
      /abc/,
      async () => {},
      () => {},
      function() {},
      (function*() {})(),
      new ArrayBuffer(2),
      new Boolean(false),
      new Boolean(true),
      new Date(),
      new Error(),
      new Map(),
      new Number(1),
      new Promise(() => {}),
      new Proxy({}, {}),
      new Set(),
      new String('abc'),
      Symbol('abc'),
      Symbol.for('def'),
      new WeakMap(),
      new WeakSet()
    ])
  })
})
