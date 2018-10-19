import path from 'path'
import { createContext } from '../../../src/utils'

describe('Component', () => {
  it('should return components as children when calling define', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const Component = await context.loadType('./')
    const component = await context.construct(Component, {})

    component.components = {
      myComponent: {
        name: 'abc'
      }
    }

    const children = await component.define()

    expect(children).toEqual(component.components)
  })

  it('should deploy', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()

    const Component = await context.loadType('./')
    const component = await context.construct(Component, {})

    component.components = {
      myComponent: {
        name: 'abc'
      }
    }

    expect(component.shouldDeploy(undefined)).toEqual('deploy')
  })
})
