const AWS = require('aws-sdk')
const awsSecurityGroupIngressComponent = require('./index')

jest.mock('@serverless/utils')

jest.mock('aws-sdk', () => {
  const mocks = {
    authorizeSecurityGroupIngressMock: jest.fn().mockResolvedValue({}),
    revokeSecurityGroupIngressMock: jest.fn().mockResolvedValue({})
  }

  const EC2 = {
    authorizeSecurityGroupIngress: (obj) => ({
      promise: () => mocks.authorizeSecurityGroupIngressMock(obj)
    }),
    revokeSecurityGroupIngress: (obj) => ({
      promise: () => mocks.revokeSecurityGroupIngressMock(obj)
    })
  }
  return {
    mocks,
    EC2: jest.fn().mockImplementation(() => EC2)
  }
})

afterEach(() => {
  Object.keys(AWS.mocks).forEach((mock) => AWS.mocks[mock].mockClear())
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Unit Tests for AWS Security Group Ingress', () => {
  it('should a new security group', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      groupId: 'sg-abbaabba',
      ipPermissions: [
        {
          fromPort: 80,
          toPort: 81,
          ipProtocol: 'tcp',
          ipRanges: [
            { cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' },
            { cidrIp: '10.1.0.0/16', description: 'VPC CIDR 2' }
          ]
        },
        {
          portRange: 'ALL',
          ipProtocol: 'tcp',
          ipRanges: [{ cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' }]
        },
        {
          portRange: 'ALL',
          ipProtocol: 'tcp',
          ipv6Ranges: [{ cidrIpCidrIpv6: '2001:db8:1234:1a00::/56', description: 'VPC CIDR 1' }]
        },
        {
          portRange: 'HTTPS*',
          ipProtocol: 'tcp',
          userIdGroupPairs: [
            { groupId: 'sg-06e05962f45221304', description: 'Allow 2 default-rituc1rx8r-787kgamw' }
          ]
        },
        {
          portRange: 'HTTPS*',
          ipProtocol: 'tcp',
          prefixListIds: ['pl-63a5400a']
        }
      ]
    }

    const response = await awsSecurityGroupIngressComponent.deploy(inputs, contextMock)
    expect(response).toEqual({})
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [
            { CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' },
            { CidrIp: '10.1.0.0/16', Description: 'VPC CIDR 2' }
          ],
          ToPort: 81
        },
        {
          FromPort: 0,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 65535
        },
        {
          FromPort: 0,
          IpProtocol: 'tcp',
          Ipv6Ranges: [{ CidrIpCidrIpv6: '2001:db8:1234:1a00::/56', Description: 'VPC CIDR 1' }],
          ToPort: 65535
        },
        {
          FromPort: 8443,
          IpProtocol: 'tcp',
          ToPort: 8443,
          UserIdGroupPairs: [
            { Description: 'Allow 2 default-rituc1rx8r-787kgamw', GroupId: 'sg-06e05962f45221304' }
          ]
        },
        { FromPort: 8443, IpProtocol: 'tcp', PrefixListIds: [{}], ToPort: 8443 }
      ]
    })
    expect(contextMock.saveState).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [
            { CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' },
            { CidrIp: '10.1.0.0/16', Description: 'VPC CIDR 2' }
          ],
          ToPort: 81
        },
        {
          FromPort: 0,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 65535
        },
        {
          FromPort: 0,
          IpProtocol: 'tcp',
          Ipv6Ranges: [{ CidrIpCidrIpv6: '2001:db8:1234:1a00::/56', Description: 'VPC CIDR 1' }],
          ToPort: 65535
        },
        {
          FromPort: 8443,
          IpProtocol: 'tcp',
          ToPort: 8443,
          UserIdGroupPairs: [
            { Description: 'Allow 2 default-rituc1rx8r-787kgamw', GroupId: 'sg-06e05962f45221304' }
          ]
        },
        { FromPort: 8443, IpProtocol: 'tcp', PrefixListIds: [{}], ToPort: 8443 }
      ]
    })
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
  })

  it('should ignore if nothing is changed', async () => {
    const contextMock = {
      state: {
        GroupId: 'sg-abbaabba',
        IpPermissions: [
          {
            FromPort: 80,
            IpProtocol: 'tcp',
            IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
            ToPort: 80
          }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      groupId: 'sg-abbaabba',
      ipPermissions: [
        {
          portRange: 'HTTP',
          ipProtocol: 'tcp',
          ipRanges: [{ cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' }]
        }
      ]
    }

    const response = await awsSecurityGroupIngressComponent.deploy(inputs, contextMock)
    expect(response).toEqual({})
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
  })

  it('should update the security group', async () => {
    const contextMock = {
      state: {
        GroupId: 'sg-abbabaab',
        IpPermissions: [
          {
            FromPort: 80,
            IpProtocol: 'tcp',
            IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
            ToPort: 80
          }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      groupId: 'sg-abbaabba',
      ipPermissions: [
        {
          portRange: 'HTTP',
          ipProtocol: 'tcp',
          ipRanges: [{ cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' }]
        }
      ]
    }

    const response = await awsSecurityGroupIngressComponent.deploy(inputs, contextMock)
    expect(response).toEqual({})
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 80
        }
      ]
    })
    expect(contextMock.saveState).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 80
        }
      ]
    })
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
  })

  it('should ignore "duplicate exists" error', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      groupId: 'sg-abbaabba',
      ipPermissions: [
        {
          portRange: 'HTTP',
          ipProtocol: 'tcp',
          ipRanges: [{ cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' }]
        }
      ]
    }

    AWS.mocks.authorizeSecurityGroupIngressMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'InvalidPermission.Duplicate', message: 'duplicate message' })

    const response = await awsSecurityGroupIngressComponent.deploy(inputs, contextMock)
    expect(response).toEqual({})
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 80
        }
      ]
    })
    expect(contextMock.saveState).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 80
        }
      ]
    })
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
  })

  it('should error on unexpected error', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      groupId: 'sg-abbaabba',
      ipPermissions: [
        {
          portRange: 'HTTP',
          ipProtocol: 'tcp',
          ipRanges: [{ cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' }]
        }
      ]
    }

    AWS.mocks.authorizeSecurityGroupIngressMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'Some.Code', message: 'Some Error' })

    let response
    try {
      await awsSecurityGroupIngressComponent.deploy(inputs, contextMock)
    } catch (exception) {
      expect(exception.message).toBe('Some Error')
    }

    expect(response).toBeUndefined()
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toBeCalledWith({
      GroupId: 'sg-abbaabba',
      IpPermissions: [
        {
          FromPort: 80,
          IpProtocol: 'tcp',
          IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
          ToPort: 80
        }
      ]
    })
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
  })

  it('should throw error when invalid port is defined', async () => {
    const contextMock = {
      state: {},
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {
      groupId: 'sg-abbaabba',
      ipPermissions: [
        {
          portRange: 'INCORRECT',
          ipProtocol: 'tcp',
          ipRanges: [{ cidrIp: '10.0.0.0/16', description: 'VPC CIDR 1' }]
        }
      ]
    }

    AWS.mocks.authorizeSecurityGroupIngressMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'Some.Code', message: 'Some Error' })

    let response
    try {
      await awsSecurityGroupIngressComponent.deploy(inputs, contextMock)
    } catch (exception) {
      expect(exception.message).toBe('Invalid port mapping "INCORRECT"')
    }

    expect(response).toBeUndefined()
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
  })

  it('should remove the security group ingress', async () => {
    const contextMock = {
      state: {
        GroupId: 'sg-abbaabba',
        IpPermissions: [
          {
            FromPort: 80,
            IpProtocol: 'tcp',
            IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
            ToPort: 80
          }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    const response = await awsSecurityGroupIngressComponent.remove(inputs, contextMock)
    expect(response).toEqual({})
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
  })

  it('should ignore error if security group ingress is manually removed', async () => {
    const contextMock = {
      state: {
        GroupId: 'sg-abbaabba',
        IpPermissions: [
          {
            FromPort: 80,
            IpProtocol: 'tcp',
            IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
            ToPort: 80
          }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    AWS.mocks.revokeSecurityGroupIngressMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'InvalidGroup.NotFound' })

    const response = await awsSecurityGroupIngressComponent.remove(inputs, contextMock)
    expect(response).toEqual({})
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
  })

  it("should ignore error if security group doesn't", async () => {
    const contextMock = {
      state: {
        GroupId: 'sg-abbaabba',
        IpPermissions: [
          {
            FromPort: 80,
            IpProtocol: 'tcp',
            IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
            ToPort: 80
          }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    AWS.mocks.revokeSecurityGroupIngressMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'InvalidPermission.NotFound' })

    const response = await awsSecurityGroupIngressComponent.remove(inputs, contextMock)
    expect(response).toEqual({})
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
  })

  it('should throw error if unexpected error occures', async () => {
    const contextMock = {
      state: {
        GroupId: 'sg-abbaabba',
        IpPermissions: [
          {
            FromPort: 80,
            IpProtocol: 'tcp',
            IpRanges: [{ CidrIp: '10.0.0.0/16', Description: 'VPC CIDR 1' }],
            ToPort: 80
          }
        ]
      },
      log: () => {},
      saveState: jest.fn()
    }

    const inputs = {}

    AWS.mocks.revokeSecurityGroupIngressMock
      .mockImplementationOnce()
      .mockRejectedValueOnce({ code: 'Some.Code' })

    let response
    try {
      response = await awsSecurityGroupIngressComponent.remove(inputs, contextMock)
    } catch (exception) {
      expect(exception.code).toBe('Some.Code')
    }
    expect(response).toBeUndefined()
    expect(contextMock.saveState).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.authorizeSecurityGroupIngressMock).toHaveBeenCalledTimes(0)
    expect(AWS.mocks.revokeSecurityGroupIngressMock).toHaveBeenCalledTimes(1)
  })
})
