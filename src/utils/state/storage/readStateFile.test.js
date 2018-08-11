const getRootInputs = require('../../components/getRootInputs')
const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamoDB = require('./aws-dynamodb')
const readStateFile = require('./readStateFile')

jest.mock('../../components/getRootInputs', () => jest.fn())

jest.mock('./local', () => {
  const mocks = {
    readMock: jest.fn().mockReturnValue('local')
  }
  return {
    mocks,
    read: (obj) => mocks.readMock(obj)
  }
})

jest.mock('./aws-s3', () => {
  const mocks = {
    readMock: jest.fn().mockReturnValue('aws-s3')
  }
  return {
    mocks,
    read: (obj) => mocks.readMock(obj)
  }
})

jest.mock('./aws-dynamodb', () => {
  const mocks = {
    readMock: jest.fn().mockReturnValue('aws-dynamodb')
  }
  return {
    mocks,
    read: (obj) => mocks.readMock(obj)
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#readStateFile()', () => {
  it('should read local file', async () => {
    getRootInputs.mockResolvedValue({ state: { type: 'local' } })
    const res = await readStateFile('local')
    expect(local.mocks.readMock).toHaveBeenCalledTimes(1)
    expect(awsS3.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsDynamoDB.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual('local')
  })

  it('should read s3 object', async () => {
    getRootInputs.mockResolvedValue({ state: { type: 'aws-s3' } })
    const res = await readStateFile('aws-s3')
    expect(local.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsS3.mocks.readMock).toHaveBeenCalledTimes(1)
    expect(awsDynamoDB.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual('aws-s3')
  })

  it('should read dynamodb row', async () => {
    getRootInputs.mockResolvedValue({ state: { type: 'aws-dynamodb' } })
    const res = await readStateFile('aws-dynamodb')
    expect(local.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsS3.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsDynamoDB.mocks.readMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual('aws-dynamodb')
  })

  it('should read local file when nothing is defined', async () => {
    getRootInputs.mockResolvedValue({})
    const res = await readStateFile('local')
    expect(res).toEqual('local')
  })
})
