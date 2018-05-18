const path = require('path')
const fse = require('fs-extra')
const BbPromise = require('bluebird')
const { fileExists, getTmpDir } = require('@serverless/utils')
const { removeFiles } = require('../helpers')

const { pkg, deploy, remove } = require('../../src')

const fsp = BbPromise.promisifyAll(fse)

describe('Integration Test - Library Usage', () => {
  jest.setTimeout(40000)

  let testServiceStateFile
  let testServiceZipFile

  beforeAll(async () => {
    await removeFiles([testServiceStateFile, testServiceZipFile])
  })

  afterAll(async () => {
    await removeFiles([testServiceStateFile, testServiceZipFile])
  })

  describe('our test setup', () => {
    it('should not have any state files', async () => {
      const testServiceHasStateFile = await fileExists(testServiceStateFile)

      expect(testServiceHasStateFile).toEqual(false)
    })
  })

  describe('when using a path to a project', () => {
    const testDir = path.dirname(__filename)
    const testServiceDir = path.join(testDir, 'library-usage')
    testServiceStateFile = path.join(testServiceDir, 'state.json')
    testServiceZipFile = path.join(testServiceDir, 'library-usage@0.0.1.zip')

    beforeAll(async () => {
      await removeFiles([testServiceStateFile, testServiceZipFile])
    })

    afterAll(async () => {
      await removeFiles([testServiceStateFile, testServiceZipFile])
    })

    describe('when running through a typical component usage lifecycle', () => {
      it('should deploy the "iam" component', async () => {
        await deploy({ projectPath: testServiceDir })
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
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
        await deploy({ projectPath: testServiceDir })
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
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

      it('should package the "iam" component', async () => {
        await pkg({ path: testServiceDir, projectPath: testServiceDir })
        const testServiceHasZipFile = await fileExists(testServiceZipFile)
        expect(testServiceHasZipFile).toEqual(true)
        // the state should not change
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
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
        await remove({ projectPath: testServiceDir })
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
        const myRole = stateFileContent['library-usage:myRole']
        const myRoleObjectKeys = Object.keys(myRole)
        expect(myRoleObjectKeys.length).toEqual(2)
        expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
        expect(myRole).toHaveProperty('state', {})
      })
    })
  })

  describe('when using a serverless.yml file object', () => {
    let oldCwd
    let tmpDirPath
    let testServiceDir

    beforeAll(async () => {
      await removeFiles([testServiceStateFile, testServiceZipFile])
      oldCwd = process.cwd()
      process.chdir(await getTmpDir())
      tmpDirPath = process.cwd()
      testServiceDir = tmpDirPath
      testServiceStateFile = path.join(testServiceDir, 'state.json')
      testServiceZipFile = path.join(testServiceDir, 'library-usage@0.0.1.zip')
    })

    afterAll(async () => {
      process.chdir(oldCwd)
      await removeFiles([testServiceStateFile, testServiceZipFile])
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
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
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
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
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

      it('should package the "iam" component', async () => {
        await pkg({ serverlessFileObject, path: testServiceDir })
        const testServiceHasZipFile = await fileExists(testServiceZipFile)
        expect(testServiceHasZipFile).toEqual(true)
        // the state should not change
        const stateFileContent = await fsp.readJsonAsync(testServiceStateFile)
        const stateFileKeys = Object.keys(stateFileContent)
        expect(stateFileKeys.length).toEqual(3)
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
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
        expect(stateFileContent).toHaveProperty('$.serviceId')
        expect(stateFileContent).toHaveProperty('library-usage:myRole')
        expect(stateFileContent.$.serviceId).not.toBeFalsy()
        const myRole = stateFileContent['library-usage:myRole']
        const myRoleObjectKeys = Object.keys(myRole)
        expect(myRoleObjectKeys.length).toEqual(2)
        expect(myRole).toHaveProperty('type', 'tests-integration-iam-mock')
        expect(myRole).toHaveProperty('state', {})
      })
    })
  })
})
