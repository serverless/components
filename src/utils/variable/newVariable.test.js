import createContext from '../context/createContext'
import newVariable from './newVariable'

describe('#newVariable()', () => {
  it('should resolve as string when coherced', () => {
    const variableString = '${foo}'
    const data = {
      foo: 123
    }
    const variable = newVariable(variableString, data)
    expect('abc' + variable).toBe('abc123')
  })

  it('should retrieve all instance ids from property path of variable', async () => {
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
    const compA = await context.construct(Component, {})
    const compB = await context.construct(Component, {})
    component.foo = {
      compA
    }
    compA.bar = {
      compB
    }
    const variableString = '${this.foo.compA.bar.compB.dne}'
    const data = {
      this: component
    }
    const variable = newVariable(variableString, data)
    expect(variable.findInstanceIds()).toEqual(
      expect.arrayContaining([component.instanceId, compA.instanceId, compB.instanceId])
    )
  })

  it('should find instances in a path that uses OR (||) definitions', async () => {
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
    const compA = await context.construct(Component, {})
    const compB = await context.construct(Component, {})
    const compC = await context.construct(Component, {})
    component.foo = {
      compA
    }
    compA.bar = 'baz'
    const variableString = '${this.foo.compA.bar || compB.dne || compC.baz || true}'
    const data = {
      this: component,
      compB,
      compC
    }
    const variable = newVariable(variableString, data)
    expect(variable.findInstanceIds()).toEqual(
      expect.arrayContaining([
        component.instanceId,
        compA.instanceId,
        compB.instanceId,
        compC.instanceId
      ])
    )
  })

  it('finds instances in a path that includes variables in the path', async () => {
    const context = await createContext(
      {},
      {
        app: {
          id: 'test'
        }
      }
    )
    const Component = await context.import('Component')
    const compA = await context.construct(Component, {})
    const compB = await context.construct(Component, {})
    const compC = await context.construct(Component, {})
    const data = {
      compA,
      compB,
      compC
    }
    compA.foo = newVariable('${compB}', data)
    compB.bar = newVariable('${compC}', data)
    const variable = newVariable('${compA.foo.bar}', data)
    expect(variable.findInstanceIds()).toEqual(
      expect.arrayContaining([compA.instanceId, compB.instanceId, compC.instanceId])
    )
  })

  it('finds instances in a path that are from variables pointing to another variable', async () => {
    const context = await createContext({}, { app: { id: 'test' } })
    const Component = await context.import('Component')
    const compA = await context.construct(Component, {})
    const compB = await context.construct(Component, {})
    compA.foo = newVariable('${compB}', {
      compB
    })
    const variable = newVariable('${compA.foo}', {
      compA
    })
    expect(variable.findInstanceIds()).toEqual(
      expect.arrayContaining([compA.instanceId, compB.instanceId])
    )
  })

  it('finds instances across the full path of both variables when a variable points to another variable', async () => {
    const context = await createContext({}, { app: { id: 'test' } })
    const Component = await context.import('Component')
    const compA = await context.construct(Component, {})
    const compB = await context.construct(Component, {})
    compA.foo = newVariable('${compB.bar}', {
      compB
    })
    compB.bar = 'bar'
    const variable = newVariable('${compA.foo}', {
      compA
    })
    expect(variable.findInstanceIds()).toEqual(
      expect.arrayContaining([compA.instanceId, compB.instanceId])
    )
  })
})
