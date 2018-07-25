const googleStorage = require('@google-cloud/storage')
const fs = require('fs-extra')
const { google } = require('googleapis')
const os = require('os')
const path = require('path')
const R = require('ramda')
const pack = require('./pack')

const cloudfunctions = google.cloudfunctions('v1')

const getAuthClient = (keyFilename) => {
  const credParts = keyFilename.split(path.sep)
  if (credParts[0] === '~') {
    credParts[0] = os.homedir()
  }
  const credentials = credParts.reduce((memo, part) => path.join(memo, part), '')
  const keyFileContent = fs.readFileSync(credentials).toString()
  const key = JSON.parse(keyFileContent)

  return new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/cloud-platform'],
    null
  )
}

const getStorageClient = (keyFilename, projectId) => {
  const credParts = keyFilename.split(path.sep)
  if (credParts[0] === '~') {
    credParts[0] = os.homedir()
  }
  const credentials = credParts.reduce((memo, part) => path.join(memo, part), '')

  const storage = new googleStorage({
    projectId: projectId,
    keyFilename: credentials
  })
  return storage
}

const extractName = (fullName) => {
  return fullName.split(path.sep)[5]
}

// Util method to compare state values to inputs
function compareInputsToState(inputs, state) {
  const hasState = !!Object.keys(state).length
  const initialData = {
    // If no state keys... no state
    hasState: hasState,
    // default everything is equal
    isEqual: true,
    // Keys that are different
    keys: [],
    // Values of the keys that are different
    diffs: {}
  }
  return Object.keys(inputs).reduce((acc, current) => {
    // if values not deep equal. There are changes
    if (!R.equals(inputs[current], state[current])) {
      return {
        hasState: hasState,
        isEqual: false,
        keys: acc.keys.concat(current),
        diffs: {
          ...acc.diffs,
          ...{
            [`${current}`]: {
              inputs: inputs[current],
              state: state[current]
            }
          }
        }
      }
    }
    return acc
  }, initialData)
}

// determines if passed in input fileds have changed
const hasInputsChanged = (componentData, inputFields) => {
  const hasChanged = inputFields.map((k) => componentData.keys.includes(k))
  return !componentData.isEqual && hasChanged.includes(true)
}

const zipAndUploadSourceCode = async (
  projectId,
  keyFilename,
  sourceCodePath,
  deploymentBucket,
  state
) => {
  // zip the source code and return archive zip file name and path as an array
  const packRes = await pack(sourceCodePath)
  const hasSourceCodeChanged = state && state.sourceArchiveHash !== packRes[2]
  // compare with state if zip contents has changed
  if (!state || !state.sourceArchiveHash || hasSourceCodeChanged) {
    const storage = getStorageClient(keyFilename, projectId)
    if (hasSourceCodeChanged) {
      console.log('Source code changes detected. Uploading source archive file.') // eslint-disable-line no-console
    } else {
      console.log('Uploading source archive file.') // eslint-disable-line no-console
    }
    // create the bucket
    await storage.createBucket(deploymentBucket).catch((err) => {
      if (err.code != 409) {
        throw err
      }
    })
    // if source code changed, delete old archive object
    if (state && hasSourceCodeChanged) {
      try {
        await storage
          .bucket(deploymentBucket)
          .file(state.sourceArchiveFilename)
          .delete()
      } catch (err) {
        console.error('Error in deleting source code archive object file: ', err.message) // eslint-disable-line no-console
      }
    }
    // upload source code zip to bucket
    await storage.bucket(deploymentBucket).upload(packRes[1])

    // get object
    await storage
      .bucket(deploymentBucket)
      .file(packRes[0])
      .makePublic()

    return {
      sourceArchiveFilename: packRes[0],
      sourceArchiveUrl: `gs://${deploymentBucket}/${packRes[0]}`,
      sourceArchiveHash: packRes[2]
    }
  } else {
    return {
      sourceArchiveFilename: state.sourceArchiveFilename,
      sourceArchiveUrl: state.sourceArchiveUrl,
      sourceArchiveHash: state.sourceArchiveHash
    }
  }
}

const createFunction = async ({
  name,
  description,
  entryPoint,
  sourceCodePath,
  timeout,
  availableMemoryMb,
  labels,
  sourceArchiveUrl,
  sourceRepository,
  sourceUploadUrl,
  // httpsTrigger,
  // eventTrigger,
  // runtime,
  projectId,
  locationId,
  keyFilename,
  // env,
  deploymentBucket
}) => {
  const location = `projects/${projectId}/locations/${locationId}`
  const authClient = getAuthClient(keyFilename)
  if (authClient) {
    const resAuth = await authClient.authorize()
    if (resAuth) {
      // upload the source code to google storage
      const zipRes = await zipAndUploadSourceCode(
        projectId,
        keyFilename,
        sourceCodePath,
        deploymentBucket,
        null
      )
      // Only one of sourceArchiveUrl, sourceRepository or sourceUploadUrl is allowed
      if (!sourceUploadUrl && !sourceRepository) {
        sourceArchiveUrl = zipRes.sourceArchiveUrl
      }
      // TODO: Dynamically assign one of: sourceUploadUrl, sourceRepository or sourceArchiveUrl
      // TODO: Dynamically assign one of: httpsTrigger or eventTrigger
      // TODO: Check why 'runtime' does not work. Only the default value of 'nodejs6' works.
      // create the function
      const params = {
        location: location,
        resource: {
          name: `${location}/functions/${name}`,
          description: description,
          entryPoint: entryPoint,
          timeout: timeout,
          availableMemoryMb: availableMemoryMb,
          labels: labels,
          sourceArchiveUrl: sourceArchiveUrl,
          httpsTrigger: {}
          // runtime: runtime
        }
      }
      const requestParams = { auth: authClient, ...params }
      const res = await cloudfunctions.projects.locations.functions.create(requestParams)
      return {
        status: res.status,
        sourceArchiveFilename: zipRes.sourceArchiveFilename,
        sourceArchiveUrl: zipRes.sourceArchiveUrl,
        sourceArchiveHash: zipRes.sourceArchiveHash
      }
    }
  }
}

const getFunction = async (inputs) => {
  // get the newly created function data
  const location = `projects/${inputs.projectId}/locations/${inputs.locationId}`
  const authClient = getAuthClient(inputs.keyFilename)
  if (authClient) {
    const resAuth = await authClient.authorize()
    if (resAuth) {
      const getParams = {
        name: `${location}/functions/${inputs.name}`
      }
      const requestGetParams = { auth: authClient, ...getParams }
      const res = await cloudfunctions.projects.locations.functions.get(requestGetParams)

      return {
        name: extractName(res.data.name),
        sourceArchiveUrl: res.data.sourceArchiveUrl,
        httpsTrigger: res.data.httpsTrigger,
        status: res.data.status,
        entryPoint: res.data.entryPoint,
        timeout: res.data.timeout,
        availableMemoryMb: res.data.availableMemoryMb,
        serviceAccountEmail: res.data.serviceAccountEmail,
        updateTime: res.data.updateTime,
        versionId: res.data.versionId,
        runtime: res.data.runtime
      }
    }
  }
}

const deleteFunction = async (state) => {
  const location = `projects/${state.projectId}/locations/${state.locationId}`
  const storage = getStorageClient(state.keyFilename, state.projectId)
  // delete source code archive object from deployment bucket
  try {
    await storage
      .bucket(state.deploymentBucket)
      .file(state.sourceArchiveFilename)
      .delete()
  } catch (err) {
    console.error('Error in deleting source code archive object file: ', err.message) // eslint-disable-line no-console
  }
  // delete deployment bucket
  try {
    await storage.bucket(state.deploymentBucket).delete()
  } catch (err) {
    console.error('Error in deleting deployment bucket: ', err.message) // eslint-disable-line no-console
  }

  // delete function
  const authClient = getAuthClient(state.keyFilename)
  if (authClient) {
    const resAuth = await authClient.authorize()
    if (resAuth) {
      const delParams = {
        name: `${location}/functions/${state.name}`
      }
      const requestDelParams = { auth: authClient, ...delParams }
      await cloudfunctions.projects.locations.functions.delete(requestDelParams)
      return {}
    }
  }
}

const patchFunction = async (
  {
    name,
    description,
    entryPoint,
    // sourceCodePath,
    timeout,
    availableMemoryMb,
    labels,
    sourceArchiveUrl,
    sourceRepository,
    sourceUploadUrl,
    // httpsTrigger,
    // eventTrigger,
    // runtime,
    projectId,
    locationId,
    keyFilename
    // env,
    // deploymentBucket
  },
  state,
  archiveRes,
  updateMask
) => {
  const location = `projects/${projectId}/locations/${locationId}`
  const authClient = getAuthClient(keyFilename)
  if (authClient) {
    const resAuth = await authClient.authorize()
    if (resAuth) {
      // Only one of sourceArchiveUrl, sourceRepository or sourceUploadUrl is allowed
      if (!sourceUploadUrl && !sourceRepository) {
        sourceArchiveUrl = archiveRes.sourceArchiveUrl
      }
      // TODO: Dynamically assign one of: sourceUploadUrl, sourceRepository or sourceArchiveUrl
      // TODO: Dynamically assign one of: httpsTrigger or eventTrigger
      // TODO: Check why 'runtime' does not work. Only the default value of 'nodejs6' works.
      // create the function
      const params = {
        name: `${location}/functions/${name}`,
        updateMask: updateMask,
        resource: {
          description: description,
          entryPoint: entryPoint,
          timeout: timeout,
          availableMemoryMb: availableMemoryMb,
          labels: labels,
          sourceArchiveUrl: sourceArchiveUrl,
          httpsTrigger: {}
          // runtime: runtime
        }
      }
      const requestParams = { auth: authClient, ...params }
      const res = await cloudfunctions.projects.locations.functions.patch(requestParams)
      return {
        status: res.status,
        sourceArchiveFilename: archiveRes.sourceArchiveFilename,
        sourceArchiveUrl: archiveRes.sourceArchiveUrl,
        sourceArchiveHash: archiveRes.sourceArchiveHash
      }
    }
  }
}

const deployFunction = async (inputs) => {
  let outputs
  const resCreate = await createFunction(inputs)
  if (resCreate.status === 200) {
    const resGet = await getFunction(inputs)
    outputs = { ...resCreate, ...resGet }
  }
  return outputs
}

const updateFunction = async (inputs, state, zipRes, updateMask) => {
  let outputs
  const resPatch = await patchFunction(inputs, state, zipRes, updateMask)
  if (resPatch.status === 200) {
    const resGet = await getFunction(inputs)
    outputs = { ...resPatch, ...resGet }
  }
  return outputs
}

const deploy = async (inputs, context) => {
  let outputs = context.state
  const componentData = compareInputsToState(inputs, context.state)
  const inputsToRecreate = ['name', 'locationId', 'projectId', 'keyFilename', 'deploymentBucket']
  const inputsToUpdate = ['entryPoint', 'sourceCodePath', 'runtime']

  if (!componentData.hasState) {
    context.log(`Creating Google Cloud Function: '${inputs.name}'`)
    outputs = await deployFunction(inputs)
  } else if (context.state.name && !inputs.name) {
    context.log(`Removing Google Cloud Function: ${context.state.name}`)
    await deleteFunction(context.state)
  } else if (componentData.hasState && hasInputsChanged(componentData, inputsToRecreate)) {
    context.log(`Removing Google Cloud Function: ${context.state.name}`)
    await deleteFunction(context.state)
    context.log(`Creating Google Cloud Function: '${inputs.name}'`)
    outputs = await deployFunction(inputs)
  } else {
    // zip & upload the source code to google storage
    const zipRes = await zipAndUploadSourceCode(
      inputs.projectId,
      inputs.keyFilename,
      inputs.sourceCodePath,
      inputs.deploymentBucket,
      context.state
    )

    if (
      (componentData.hasState && zipRes.sourceArchiveHash !== context.state.sourceArchiveHash) ||
      hasInputsChanged(componentData, inputsToUpdate)
    ) {
      context.log(`Updating Google Cloud Function: ${inputs.name}`)
      let updateMask = componentData.keys || []
      if (zipRes.sourceArchiveHash !== context.state.sourceArchiveHash) {
        updateMask.push('sourceArchiveUrl')
      }
      outputs = await updateFunction(inputs, context.state, zipRes, updateMask)
    }
  }

  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  try {
    context.log(`Removing Google Cloud Function: '${inputs.name}'.`)
    await deleteFunction(context.state)
  } catch (e) {
    if (!e.message.includes('does not exist')) {
      throw new Error(e)
    }
  }

  context.saveState()
  return {}
}

const info = async (inputs, context) => {
  if (!context.state.name) return {}

  let outputs = context.state
  let resGet = {}

  try {
    resGet = await getFunction(inputs)
  } catch (e) {
    context.log('Error in fetching function: ', e)
  }

  context.saveState({ ...inputs, ...outputs, ...resGet })

  context.log(`Function url: ${context.state.httpsTrigger.url}`)
}

module.exports = {
  deploy,
  remove,
  info
}
