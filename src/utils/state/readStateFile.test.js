import getRootInputs from '../components/getRootInputs'
import local from './storage/local'
import awsS3 from './storage/aws-s3'
import awsDynamoDB from './storage/aws-dynamodb'
import readStateFile from './readStateFile'

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
    getRootInputs.mockReturnValue(Promise.resolve({ state: { type: 'local' } }))
    const res = await readStateFile('local')
    expect(local.mocks.readMock).toHaveBeenCalledTimes(1)
    expect(awsS3.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsDynamoDB.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual('local')
  })

  it('should read s3 object', async () => {
    getRootInputs.mockReturnValue(Promise.resolve({ state: { type: 'aws-s3' } }))
    const res = await readStateFile('aws-s3')
    expect(local.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsS3.mocks.readMock).toHaveBeenCalledTimes(1)
    expect(awsDynamoDB.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual('aws-s3')
  })

  it('should read dynamodb row', async () => {
    getRootInputs.mockReturnValue(Promise.resolve({ state: { type: 'aws-dynamodb' } }))
    const res = await readStateFile('aws-dynamodb')
    expect(local.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsS3.mocks.readMock).toHaveBeenCalledTimes(0)
    expect(awsDynamoDB.mocks.readMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual('aws-dynamodb')
  })

  it('should read local file when nothing is defined', async () => {
    getRootInputs.mockReturnValue(Promise.resolve({}))
    const res = await readStateFile('local')
    expect(res).toEqual('local')
  })
})
