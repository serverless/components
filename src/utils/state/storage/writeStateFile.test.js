const getConfig = require('../../misc/getConfig')
const local = require('./local')
const awsS3 = require('./aws-s3')
const awsDynamo = require('./aws-dynamo')
const writeStateFile = require('./writeStateFile')

jest.mock('../../misc/getConfig', () => jest.fn())

jest.mock('./local', () => {
  const mocks = {
    writeMock: jest.fn().mockReturnValue('local')
  }
  return {
    mocks,
    write: (obj) => mocks.writeMock(obj)
  }
})

jest.mock('./aws-s3', () => {
  const mocks = {
    writeMock: jest.fn().mockReturnValue('aws-s3')
  }
  return {
    mocks,
    write: (obj) => mocks.writeMock(obj)
  }
})

jest.mock('./aws-dynamo', () => {
  const mocks = {
    writeMock: jest.fn().mockReturnValue('aws-dynamodb')
  }
  return {
    mocks,
    write: (obj) => mocks.writeMock(obj)
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#writeStateFile()', () => {
  it('should write local file', async () => {
    getConfig.mockResolvedValue({ state: { type: 'local' } })
    const res = await writeStateFile('local')
    expect(local.mocks.writeMock).toHaveBeenCalledTimes(1)
    expect(awsS3.mocks.writeMock).toHaveBeenCalledTimes(0)
    expect(awsDynamo.mocks.writeMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual('local')
  })

  it('should write s3 object', async () => {
    getConfig.mockResolvedValue({ state: { type: 'aws-s3' } })
    const res = await writeStateFile('aws-s3')
    expect(local.mocks.writeMock).toHaveBeenCalledTimes(0)
    expect(awsS3.mocks.writeMock).toHaveBeenCalledTimes(1)
    expect(awsDynamo.mocks.writeMock).toHaveBeenCalledTimes(0)
    expect(res).toEqual('aws-s3')
  })

  it('should write dynamodb row', async () => {
    getConfig.mockResolvedValue({ state: { type: 'aws-dynamodb' } })
    const res = await writeStateFile('aws-dynamodb')
    expect(local.mocks.writeMock).toHaveBeenCalledTimes(0)
    expect(awsS3.mocks.writeMock).toHaveBeenCalledTimes(0)
    expect(awsDynamo.mocks.writeMock).toHaveBeenCalledTimes(1)
    expect(res).toEqual('aws-dynamodb')
  })

  it('should write local file when nothing is defined', async () => {
    getConfig.mockResolvedValue({})
    const res = await writeStateFile('local')
    expect(res).toEqual('local')
  })
})
