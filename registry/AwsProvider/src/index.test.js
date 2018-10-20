import AWS from 'aws-sdk'
import path from 'path'
import { createContext } from '../../../src/utils'

jest.mock('aws-sdk', () => {
  const mocks = {
    update: jest.fn()
  }
  return {
    mocks,
    config: {
      update: (obj) => mocks.update(obj)
    }
  }
})
describe('AwsProvider', () => {
  it('should getSdk', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()
    const inputs = {
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'zxc'
      },
      region: 'us-east-1'
    }

    const AwsProvider = await context.loadType('./')
    const awsProvider = await context.construct(AwsProvider, inputs)
    awsProvider.credentials = inputs.credentials
    awsProvider.region = inputs.region

    const AwsSdk = awsProvider.getSdk()

    expect(AwsSdk).toEqual(AWS)
    expect(AWS.mocks.update).toBeCalledWith(inputs)
  })

  it('should getCredentials', async () => {
    let context = await createContext({
      cwd: path.join(__dirname, '..')
    })

    context = await context.loadProject()
    context = await context.loadApp()
    const inputs = {
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'zxc'
      },
      region: 'us-east-1'
    }

    const AwsProvider = await context.loadType('./')
    const awsProvider = await context.construct(AwsProvider, inputs)
    awsProvider.credentials = inputs.credentials
    awsProvider.region = inputs.region

    const credentials = awsProvider.getCredentials()

    expect(credentials).toEqual(inputs)
  })
})
