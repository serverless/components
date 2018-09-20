const AWS = require('aws-sdk')
const ELBComponent = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    createLoadBalancerMock: jest.fn().mockImplementation(() => {
      return Promise.resolve({ LoadBalancers:
                               [ { LoadBalancerArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107',
                                   LoadBalancerName: 'my-project-elb',
                                   Scheme: 'internet-facing',
                                   Type: 'application',
                                   IpAddressType: 'ipv4'} ] }
                               )}),
    deleteLoadBalancerMock: jest.fn().mockReturnValue({}),
    setSecurityGroupsMock: jest.fn().mockReturnValue({}),
    setSubnetsMock: jest.fn().mockReturnValue({})
}

  const ELBv2 = {
    createLoadBalancer: (obj) => ({
      promise: () => mocks.createLoadBalancerMock(obj)
    }),
    deleteLoadBalancer: (obj) => (
      mocks.deleteLoadBalancerMock(obj)
    ),
    setSecurityGroups: (obj) => (
      mocks.setSecurityGroupsMock(obj)
    ),
    setSubnets: (obj) => (
      mocks.setSubnetsMock(obj)
    )
}

  return {
    mocks,
    ELBv2: jest.fn().mockImplementation(() => ELBv2)
  }
})

afterEach(() => {
  AWS.mocks.createLoadBalancerMock.mockClear()
  AWS.mocks.deleteLoadBalancerMock.mockClear()
  AWS.mocks.setSecurityGroupsMock.mockClear()
  AWS.mocks.setSubnetsMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('aws-elb tests', () => {
  it('should deploy an ELB component with no errors', async () => {
    const contextMock = {
      state: {},
      archive: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      name: 'my-project-elb',
      subnets: ["subnet-0b8da2094908e1b23","subnet-01a46af43b2c5e16c"]
    }

    const {arn} = await ELBComponent.deploy(inputs, contextMock)

    expect(AWS.ELBv2).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createLoadBalancerMock).toHaveBeenCalledTimes(1)
    expect(arn).toEqual('arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107')
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
  })
  it('should remove an existing ELB', async () => {
    const contextMock = {
      state: {
        name: 'my-project-elb',
         arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107'
      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {}
    const outputs = await ELBComponent.remove(inputs, contextMock)

    expect(AWS.ELBv2).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.deleteLoadBalancerMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
    expect(outputs).toEqual({})
  })
  it('should update security group an existing ELB', async () => {
    const contextMock = {
      state: {
        name: 'my-project-elb',
         arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107',
        subnets: ["subnet-0b8da2094908e1b23","subnet-01a46af43b2c5e16c"],
        securityGroups: ["sg-03fa0c02886c183d4"]

      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {
      name: 'my-project-elb',
      arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107',
     subnets: ["subnet-0b8da2094908e1b23","subnet-01a46af43b2c5e16c"],
     securityGroups: ["sg-06f16046d66441c1c"]
    }
    const {arn} = await ELBComponent.deploy(inputs, contextMock)

    expect(AWS.ELBv2).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createLoadBalancerMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteLoadBalancerMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.setSecurityGroupsMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(arn).toEqual('arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107')
    expect(contextMock.state.securityGroups).toEqual(inputs.securityGroups)
  })
  it('should update subnets of an existing ELB', async () => {
    const contextMock = {
      state: {
        name: 'my-project-elb',
         arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107',
        subnets: ["subnet-0b8da2094908e1b23","subnet-01a46af43b2c5e16c"],
        securityGroups: ["sg-03fa0c02886c183d4"]
      },
      log: () => {},
      saveState: jest.fn()
    }
    const inputs = {
      name: 'my-project-elb',
      arn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107',
     subnets: ["subnet-0b8da2094908e1b23","subnet-02579e43d5262dfeb"],
     securityGroups: ["sg-03fa0c02886c183d4"]
    }
    const {arn} = await ELBComponent.deploy(inputs, contextMock)
    expect(AWS.ELBv2).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.createLoadBalancerMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.deleteLoadBalancerMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.setSubnetsMock).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(arn).toEqual('arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-project-elb/b8aeaf4b672f5107')
    expect(contextMock.state.subnets).toEqual(inputs.subnets)
  })
})
