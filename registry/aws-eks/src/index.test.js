const AWS = require('aws-sdk');
const eksComponent = require('./index');

jest.mock('aws-sdk', () => {
  const mocks = {
    createClusterMock: jest.fn().mockImplementation((params) => {
      return Promise.resolve({data: {name: "kluster", arn: "1", status: "CREATING", endpoint: "https://endpoint" } });
    }),

    deleteClusterMock: jest.fn().mockImplementation((params) => {
      if (params.name == "kluster") {
        return Promise.resolve(
          { data: { name: "kluster",
                    status: "DELETING" },
          });
      } else return Promise.reject();
    })
  };

  const EKS = {
    createCluster: (obj) => ({
      promise: () => mocks.createClusterMock(obj)
    }),
    deleteCluster: (obj) => ({
      promise: () => mocks.deleteClusterMock(obj)
    })
  };

  return {
    mocks,
    EKS: jest.fn().mockImplementation(() => EKS)
  }
})

afterEach(() => {
  AWS.mocks.createClusterMock.mockClear()
  AWS.mocks.deleteClusterMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('creating an EKS cluster', () => {
  it('should call AWS SDK', async () => {
    await expect(eksComponent.deploy({})).
      resolves.toEqual({name: "kluster", arn: "1", status: "CREATING", endpoint: "https://endpoint" });
    expect(AWS.EKS).toHaveBeenCalledTimes(1);
    expect(AWS.mocks.createClusterMock).toHaveBeenCalledTimes(1);
  });
});

describe('deleting an EKS cluster', () => {
  it('should call AWS SDK', async () => {
    await expect(eksComponent.remove("kluster")).
      resolves.toEqual({name: "kluster", status: "DELETING"});
  });
});
