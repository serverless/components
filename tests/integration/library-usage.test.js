import AWS from 'aws-sdk'

const path = require('path')
const fse = require('fs-extra')
const BbPromise = require('bluebird')
const { fileExists, getTmpDir } = require('@serverless/utils')
const { removeFiles } = require('../helpers')

const { deploy, remove } = require('../../src')

const fsp = BbPromise.promisifyAll(fse)

describe('Integration Test - Library Usage', () => {
  jest.setTimeout(40000)

  let testServiceStateDirectory
  let testServiceZipFile

  beforeAll(async () => {
    await removeFiles([testServiceStateDirectory, testServiceZipFile])
  })

  afterAll(async () => {
    await removeFiles([testServiceStateDirectory, testServiceZipFile])
  })

  describe('our test setup', () => {
    it('should not have any state files', async () => {
      const testServiceHasStateFile = await fileExists(testServiceStateDirectory)

      expect(testServiceHasStateFile).toEqual(false)
    })
  })

  describe('when using a path to a project', () => {
    const testServiceDir = path.join(__dirname, 'library-usage')
    testServiceStateDirectory = path.join(testServiceDir, '.serverless')
    testServiceZipFile = path.join(testServiceDir, 'library-usage@0.0.1.zip')

    beforeAll(async () => {
      await removeFiles([testServiceStateDirectory, testServiceZipFile])
    })

    afterAll(async () => {
      await removeFiles([testServiceStateDirectory, testServiceZipFile])
    })

    describe('when running through a typical component usage lifecycle', () => {
      it('should deploy the "AwsS3Bucket" component', async () => {
        const context = await deploy({ cwd: testServiceDir })
        expect(AWS.mocks.createBucketMock).toBeCalledWith({ Bucket: 'mySuperBucket' })
        const service = context.instance
        expect(service).not.toBeFalsy()
        expect(service).toMatchObject({
          instanceId: expect.any(String),
          name: 'LibraryUsage',
          components: expect.any(Object)
        })
        const bucket = service.components.myBucket
        expect(bucket).not.toBeFalsy()
        expect(bucket).toMatchObject({
          bucketName: 'mySuperBucket',
          instanceId: expect.any(String)
        })
      })
      it('should remove the "AwsS3Bucket" components', async () => {
        let context = await deploy({ cwd: testServiceDir })
        context = await remove({ cwd: testServiceDir })
        expect(AWS.mocks.deleteBucketMock).toBeCalledWith({ Bucket: 'mySuperBucket' })
        expect(AWS.mocks.listObjectsV2Mock).toBeCalledWith({ Bucket: 'mySuperBucket' })
        expect(AWS.mocks.deleteObjectsMock).toBeCalledWith({
          Bucket: 'mySuperBucket',
          Delete: { Objects: [{ Key: 'abc' }] }
        })
        expect(context.instance).toBeFalsy()
      })
    })
  })

  describe('when using a serverless.yml file object', () => {
    let oldCwd
    let tmpDirPath
    let testServiceDir

    beforeAll(async () => {
      await removeFiles([testServiceStateDirectory, testServiceZipFile])
      oldCwd = process.cwd()
      process.chdir(await getTmpDir())
      tmpDirPath = process.cwd()
      testServiceDir = tmpDirPath
      testServiceStateDirectory = path.join(testServiceDir, '.serverless')
      testServiceZipFile = path.join(testServiceDir, 'library-usage@0.0.1.zip')
    })

    afterAll(async () => {
      process.chdir(oldCwd)
      await removeFiles([testServiceStateDirectory, testServiceZipFile])
    })

    // NOTE: this is the JavaScript object representation of the same project we're
    // using in the tests where we pass in the project path
    const serverlessFileObject = {
      type: 'library-usage',
      version: '0.0.1',
      components: {
        myRole: {
          type: 'tests-integration-iam-mock',
          inputs: {
            name: 'my-role',
            service: 'my.role.service'
          }
        }
      }
    }

    describe('when running through a typical component usage lifecycle', () => {
      it('should deploy the "iam" component', async () => {
        await deploy({ serverlessFileObject })
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.appId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.appId).not.toBeFalsy()
        const myRole = stateFileContent['library-usage:myRole']
        const myRoleObjectKeys = Object.keys(myRole)
        expect(myRoleObjectKeys.length).toEqual(6)
        expect(myRole).toHaveProperty('instanceId')
        expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
        expect(myRole).toHaveProperty('internallyManaged', false)
        expect(myRole).toHaveProperty('rootPath')
        expect(myRole).toHaveProperty('state', {
          id: 'id:iam:role:my-role',
          name: 'my-role',
          service: 'my.role.service',
          deploymentCounter: 1
        })
        expect(myRole.instanceId).not.toBeFalsy()
      })

      it('should re-deploy the "iam" component', async () => {
        await deploy({ serverlessFileObject })
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.appId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.appId).not.toBeFalsy()
        const myRole = stateFileContent['library-usage:myRole']
        const myRoleObjectKeys = Object.keys(myRole)
        expect(myRoleObjectKeys.length).toEqual(6)
        expect(myRole).toHaveProperty('instanceId')
        expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
        expect(myRole).toHaveProperty('internallyManaged', false)
        expect(myRole).toHaveProperty('rootPath')
        expect(myRole).toHaveProperty('state', {
          id: 'id:iam:role:my-role',
          name: 'my-role',
          service: 'my.role.service',
          deploymentCounter: 2
        })
        expect(myRole.instanceId).not.toBeFalsy()
      })

      it('should remove the "iam" and "function" components', async () => {
        await remove({ serverlessFileObject })
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.appId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.appId).not.toBeFalsy()
        const myRole = stateFileContent['library-usage:myRole']
        const myRoleObjectKeys = Object.keys(myRole)
        expect(myRoleObjectKeys.length).toEqual(2)
        expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
        expect(myRole).toHaveProperty('state', {})
      })
    })
  })
})
