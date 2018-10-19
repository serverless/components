import Cron from './index'

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Cron', () => {
  it('should call defineSchedule on compute', async () => {
    const scope = {
      rate: '5m'
    } // cause function is reserved keyword...
    scope.function = {
      compute: {
        defineSchedule: jest.fn().mockReturnValue({ functionRuleName: 'hello' })
      }
    }

    const expectedChildren = {
      schedule: {
        functionRuleName: 'hello'
      }
    }

    const children = await Cron.define.call(scope, {})
    expect(scope.function.compute.defineSchedule).toBeCalledWith(scope.function, scope.rate, {})
    expect(children).toEqual(expectedChildren)
  })
})
