import path from 'path'
import { tmpdir } from 'os'
import { readFileSync } from 'fs'
import { hashElement } from 'folder-hash'
import {
  equals,
  get,
  isArray,
  isEmpty,
  isArchivePath,
  keys,
  not,
  packDir,
  pick,
  resolve
} from '@serverless/utils'

const publishLayerVersion = async (
  Lambda,
  { layerName, zip, layerDescription, licenseInfo, compatibleRuntimes }
) => {
  const params = {
    LayerName: layerName,
    Content: {
      ZipFile: zip
    },
    Description: layerDescription,
    LicenseInfo: licenseInfo,
    CompatibleRuntimes: compatibleRuntimes
  }

  return await Lambda.publishLayerVersion(params).promise()
}

const deleteLayerVersion = async (Lambda, layerName, version) => {
  const params = { LayerName: layerName, VersionNumber: version }
  await Lambda.deleteLayerVersion(params).promise()
}

const hashContents = async (content) => {
  // TODO BRN: Upgrade this to hash all content references in the array. Need to redeploy in the event that the shim changes.
  const options = {
    folders: { exclude: ['node_modules'] }
  }
  let folderToHash = content
  if (isArray(content)) {
    folderToHash = content[0]
  }
  const hashObj = await hashElement(folderToHash, options)
  return hashObj.hash
}

const AwsLambdaLayerVersion = async (SuperClass) => {
  return class extends SuperClass {
    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.arn = get('arn', prevInstance)
      this.zip = get('zip', prevInstance)
      this.layerVersion = get('layerVersion', prevInstance)
      this.versions = get('versions', prevInstance)
    }

    async shouldDeploy(prevInstance) {
      this.hash = await hashContents(this.content)

      const currentConfig = pick(
        ['layerName', 'layerDescription', 'content', 'compatibleRuntimes', 'licenseInfo', 'hash'],
        this
      )
      const prevConfig = prevInstance ? pick(keys(currentConfig), prevInstance) : {}
      const configChanged = not(equals(currentConfig, prevConfig))

      if (
        prevInstance &&
        ((this.retain === false && configChanged) ||
          (prevInstance.layerName !== currentConfig.layerName && this.retain !== true))
      ) {
        return 'replace'
      } else if (!prevInstance || configChanged) {
        return 'deploy'
      }
    }

    getId() {
      return this.arn
    }

    async pack() {
      let inputDirPath = this.content

      if (isArray(this.content)) {
        inputDirPath = this.content[0] // first item is path to content dir
      }

      const outputFileName = `${this.instanceId}-${Date.now()}.zip`
      const outputFilePath = path.join(tmpdir(), outputFileName)

      await packDir(inputDirPath, outputFilePath)
      this.zip = readFileSync(outputFilePath)
      return this.zip
    }

    async sync() {
      let { provider } = this
      provider = resolve(provider)
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()

      const { LayerVersions } = await Lambda.listLayerVersions({
        LayerName: resolve(this.layerName)
      }).promise()
      if (isEmpty(LayerVersions)) {
        return 'removed'
      }
      this.versions = LayerVersions.map(({ Version }) => Version)
      this.layerVersion = Math.max(...this.versions)
      this.arn = LayerVersions.filter(
        ({ Version }) => Version === this.layerVersion
      )[0].LayerVersionArn
    }

    async deploy(prevInstance, context) {
      const { provider } = this
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()

      if (isArchivePath(this.content)) {
        this.zip = readFileSync(this.content)
      } else {
        await this.pack(context)
      }

      context.log(`Publishing Lambda Layer Version: ${this.layerName}`)
      const newLayerVersion = await publishLayerVersion(Lambda, this)
      this.arn = newLayerVersion.LayerArn
      this.layerVersion = newLayerVersion.Version
      if (!this.versions) {
        this.versions = []
      }
      this.versions.push(this.layerVersion)
    }

    async remove(context) {
      const { layerName, versions, retain, provider } = this
      const AWS = provider.getSdk()
      const Lambda = new AWS.Lambda()

      if (retain === true) {
        context.log(`Skipping removing(per retention policy) Lambda Layer Version: ${layerName}`)
        return
      }

      context.log(`Removing Lambda Layer Versions: ${layerName}`)

      for (const version of versions) {
        try {
          await deleteLayerVersion(Lambda, layerName, version)
        } catch (error) {
          if (error.content !== 'ResourceNotFoundException') {
            throw error
          }
        }
      }
    }

    async info() {
      return {
        title: this.layerName,
        type: this.name,
        data: {
          compatibleRuntimes: this.compatibleRuntimes && this.compatibleRuntimes.join(', '),
          version: this.layerVersion,
          ...pick(['layerDescription', 'licenseInfo', 'arn'], this)
        }
      }
    }
  }
}

export default AwsLambdaLayerVersion
