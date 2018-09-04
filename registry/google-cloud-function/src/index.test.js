const googleapis = require('googleapis')
const gcfComponent = require('./index')
const { getAuthClient, getStorageClient, zipAndUploadSourceCode } = require('./utils')

jest.mock('./utils/getAuthClient', () =>
  jest.fn(() =>
    Promise.resolve({
      authorize: () => Promise.resolve(true)
    })
  )
)
jest.mock('./utils/getStorageClient', () =>
  jest.fn(() => ({
    bucket: () => ({
      file: () => ({
        delete: jest.fn(() => Promise.resolve())
      }),
      delete: jest.fn(() => Promise.resolve())
    })
  }))
)
jest.mock('./utils/zipAndUploadSourceCode', () =>
  jest.fn(() =>
    Promise.resolve({
      sourceArchiveFilename: 'file-name',
      sourceArchiveUrl: 'gs://my-bucket/file-name',
      sourceArchiveHash: 'new-hash'
    })
  )
)
jest.mock('googleapis', () => {
  const mocks = {
    mockCreate: jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200
      })
    ),
    mockGet: jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: {
          name: 'projects/my-project/locations/us-east1/functions/my-function',
          sourceArchiveUrl: 'gs://my-bucket/file-name',
          httpsTrigger: 'https-trigger',
          eventTrigger: 'event-trigger',
          status: 'success',
          entryPoint: 'index',
          timeout: '60s',
          availableMemoryMb: 512,
          serviceAccountEmail: 'jdoe@example.com',
          updateTime: '1234',
          versionId: 'version-id-1234',
          runtime: 'nodejs6'
        }
      })
    ),
    mockDelete: jest.fn().mockImplementation(() => Promise.resolve()),
    mockPatch: jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200
      })
    )
  }

  return {
    google: {
      cloudfunctions: () => ({
        projects: {
          locations: {
            functions: {
              create: mocks.mockCreate,
              get: mocks.mockGet,
              delete: mocks.mockDelete,
              patch: mocks.mockPatch
            }
          }
        }
      })
    },
    mocks
  }
})

afterAll(() => {
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.clearAllMocks()
  googleapis.mocks.mockCreate.mockClear()
  googleapis.mocks.mockGet.mockClear()
  googleapis.mocks.mockDelete.mockClear()
  googleapis.mocks.mockPatch.mockClear()
})

describe('google-cloud-function tests', () => {
  let inputs
  let state

  beforeEach(() => {
    inputs = {
      name: 'my-function',
      projectId: 'project-id-1234',
      locationId: 'us-east1',
      keyFilename: 'key-file-name.json',
      sourceCodePath: '/source/code-path',
      deploymentBucket: 'my-bucket',
      httpsTrigger: 'https-trigger',
      eventTrigger: 'event-trigger',
      timeout: '60s',
      availableMemoryMb: 512,
      runtime: 'nodejs6'
    }
    state = {
      name: 'my-function',
      projectId: 'project-id-1234',
      locationId: 'us-east1',
      keyFilename: 'key-file-name.json',
      deploymentBucket: 'my-bucket',
      sourceArchiveFilename: 'file-name'
    }
  })

  describe('when doing a function deployment', () => {
    it('should deploy a non-existent function', async () => {
      const context = {
        log: jest.fn(),
        state: {},
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      const outputs = await gcfComponent.deploy(inputs, context)

      expect(outputs).toEqual({
        name: 'my-function',
        sourceArchiveUrl: 'gs://my-bucket/file-name',
        httpsTrigger: 'https-trigger',
        eventTrigger: 'event-trigger',
        status: 'success',
        entryPoint: 'index',
        timeout: '60s',
        availableMemoryMb: 512,
        sourceArchiveFilename: 'file-name',
        sourceArchiveHash: 'new-hash',
        serviceAccountEmail: 'jdoe@example.com',
        updateTime: '1234',
        versionId: 'version-id-1234',
        runtime: 'nodejs6'
      })
      expect(getAuthClient).toHaveBeenCalledTimes(2)
      expect(zipAndUploadSourceCode).toHaveBeenCalledTimes(1)
      expect(googleapis.mocks.mockCreate.mock.calls[0][0].location).toEqual(
        'projects/project-id-1234/locations/us-east1'
      )
      expect(googleapis.mocks.mockCreate.mock.calls[0][0].resource).toEqual({
        name: 'projects/project-id-1234/locations/us-east1/functions/my-function',
        description: undefined,
        entryPoint: undefined,
        timeout: '60s',
        availableMemoryMb: 512,
        labels: undefined,
        sourceArchiveUrl: 'gs://my-bucket/file-name',
        environmentVariables: undefined,
        httpsTrigger: 'https-trigger',
        eventTrigger: 'event-trigger',
        runtime: 'nodejs6'
      })
      expect(googleapis.mocks.mockGet.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/my-function'
      )
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })

    it('should remove the function if the name is not provided via inputs', async () => {
      inputs = {}
      const context = {
        log: jest.fn(),
        state,
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      const outputs = await gcfComponent.deploy(inputs, context)

      expect(outputs).toEqual({
        deploymentBucket: 'my-bucket',
        keyFilename: 'key-file-name.json',
        locationId: 'us-east1',
        name: 'my-function',
        projectId: 'project-id-1234',
        sourceArchiveFilename: 'file-name'
      })
      expect(getStorageClient).toHaveBeenCalledTimes(1)
      expect(getAuthClient).toHaveBeenCalledTimes(1)
      expect(googleapis.mocks.mockDelete.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/my-function'
      )
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })

    it('should delete and deploy the function if the inputs have changed', async () => {
      const context = {
        log: jest.fn(),
        state: {
          ...state,
          name: 'old-function'
        },
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      const outputs = await gcfComponent.deploy(inputs, context)

      expect(outputs).toEqual({
        name: 'my-function',
        sourceArchiveUrl: 'gs://my-bucket/file-name',
        httpsTrigger: 'https-trigger',
        eventTrigger: 'event-trigger',
        status: 'success',
        entryPoint: 'index',
        timeout: '60s',
        availableMemoryMb: 512,
        sourceArchiveFilename: 'file-name',
        sourceArchiveHash: 'new-hash',
        serviceAccountEmail: 'jdoe@example.com',
        updateTime: '1234',
        versionId: 'version-id-1234',
        runtime: 'nodejs6'
      })
      expect(getAuthClient).toHaveBeenCalledTimes(3)
      expect(getStorageClient).toHaveBeenCalledTimes(1)
      expect(zipAndUploadSourceCode).toHaveBeenCalledTimes(1)
      expect(googleapis.mocks.mockDelete.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/old-function'
      )
      expect(googleapis.mocks.mockCreate.mock.calls[0][0].location).toEqual(
        'projects/project-id-1234/locations/us-east1'
      )
      expect(googleapis.mocks.mockCreate.mock.calls[0][0].resource).toEqual({
        name: 'projects/project-id-1234/locations/us-east1/functions/my-function',
        description: undefined,
        entryPoint: undefined,
        timeout: '60s',
        availableMemoryMb: 512,
        labels: undefined,
        sourceArchiveUrl: 'gs://my-bucket/file-name',
        environmentVariables: undefined,
        httpsTrigger: 'https-trigger',
        eventTrigger: 'event-trigger',
        runtime: 'nodejs6'
      })
      expect(googleapis.mocks.mockGet.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/my-function'
      )
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })

    it('should update the function if inputs and state are the same but the code has changed', async () => {
      inputs = {
        ...inputs,
        ...state
      }
      const context = {
        log: jest.fn(),
        state: {
          ...state,
          sourceArchiveHash: 'old-hash'
        },
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      const outputs = await gcfComponent.deploy(inputs, context)

      expect(outputs).toEqual({
        status: 'success',
        sourceArchiveFilename: 'file-name',
        sourceArchiveUrl: 'gs://my-bucket/file-name',
        sourceArchiveHash: 'new-hash',
        name: 'my-function',
        httpsTrigger: 'https-trigger',
        eventTrigger: 'event-trigger',
        entryPoint: 'index',
        timeout: '60s',
        availableMemoryMb: 512,
        serviceAccountEmail: 'jdoe@example.com',
        updateTime: '1234',
        versionId: 'version-id-1234',
        runtime: 'nodejs6'
      })
      expect(getAuthClient).toHaveBeenCalledTimes(2)
      expect(zipAndUploadSourceCode).toHaveBeenCalledTimes(1)
      expect(googleapis.mocks.mockPatch.mock.calls[0][0].updateMask).toEqual(
        'httpsTrigger,eventTrigger,timeout,availableMemoryMb,runtime,sourceArchiveUrl'
      )
      expect(googleapis.mocks.mockPatch.mock.calls[0][0].resource).toEqual({
        description: undefined,
        entryPoint: undefined,
        timeout: '60s',
        availableMemoryMb: 512,
        labels: undefined,
        sourceArchiveUrl: 'gs://my-bucket/file-name',
        environmentVariables: undefined,
        httpsTrigger: 'https-trigger',
        eventTrigger: 'event-trigger',
        runtime: 'nodejs6'
      })
      expect(googleapis.mocks.mockGet.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/my-function'
      )
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })

  describe('when doing a function removal', () => {
    it('should return if there is no name stored in the state', async () => {
      delete state.name
      const context = {
        log: jest.fn(),
        state,
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      const res = await gcfComponent.remove(inputs, context)

      expect(res).toEqual({})
    })

    it('should remove a function', async () => {
      const context = {
        log: jest.fn(),
        state,
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      const outputs = await gcfComponent.remove(inputs, context)

      expect(outputs).toEqual({})
      expect(getStorageClient).toHaveBeenCalledTimes(1)
      expect(getAuthClient).toHaveBeenCalledTimes(1)
      expect(googleapis.mocks.mockDelete.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/my-function'
      )
      expect(context.saveState).toHaveBeenCalledTimes(1)
    })
  })

  describe('when retrieving a functions info', () => {
    it('should return if there is no name stored in the state', async () => {
      delete state.name
      const context = {
        log: jest.fn(),
        state,
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      await gcfComponent.info(inputs, context)

      expect(context.saveState).toHaveBeenCalledTimes(0)
      expect(context.log).toHaveBeenCalledTimes(0)
    })

    it('should return a functions information', async () => {
      const context = {
        log: jest.fn(),
        state: {
          ...state,
          httpsTrigger: {
            url: 'http://example.com/some-url'
          }
        },
        archive: {},
        saveState: jest.fn(),
        load: jest.fn()
      }

      await gcfComponent.info(inputs, context)

      expect(googleapis.mocks.mockGet.mock.calls[0][0].name).toEqual(
        'projects/project-id-1234/locations/us-east1/functions/my-function'
      )
      expect(context.saveState).toHaveBeenCalledTimes(1)
      expect(context.log).toHaveBeenCalledTimes(1)
    })
  })
})
