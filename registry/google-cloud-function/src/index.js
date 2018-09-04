/* eslint-disable no-console */

const { google } = require('googleapis')
const {
  compareInputsToState,
  extractName,
  generateUpdateMask,
  getAuthClient,
  getStorageClient,
  haveInputsChanged,
  zipAndUploadSourceCode
} = require('./utils')

const cloudfunctions = google.cloudfunctions('v1')

// "private" functions
async function createFunction({
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
  httpsTrigger,
  eventTrigger,
  runtime,
  projectId,
  locationId,
  keyFilename,
  environmentVariables,
  deploymentBucket
}) {
  const location = `projects/${projectId}/locations/${locationId}`
  const authClient = await getAuthClient(keyFilename)
  if (authClient) {
    const resAuth = await authClient.authorize()
    if (resAuth) {
      const zipRes = await zipAndUploadSourceCode(
        projectId,
        keyFilename,
        sourceCodePath,
        deploymentBucket,
        null
      )
      if (!sourceUploadUrl && !sourceRepository) {
        sourceArchiveUrl = zipRes.sourceArchiveUrl
      }
      // TODO: Dynamically assign one of: sourceUploadUrl, sourceRepository or sourceArchiveUrl
      const params = {
        location,
        resource: {
          name: `${location}/functions/${name}`,
          description,
          entryPoint,
          timeout,
          availableMemoryMb,
          labels,
          sourceArchiveUrl,
          environmentVariables,
          httpsTrigger,
          eventTrigger,
          runtime
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

async function getFunction(inputs) {
  const location = `projects/${inputs.projectId}/locations/${inputs.locationId}`
  const authClient = await getAuthClient(inputs.keyFilename)
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
        eventTrigger: res.data.eventTrigger,
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

async function deleteFunction(state) {
  const location = `projects/${state.projectId}/locations/${state.locationId}`
  const storage = getStorageClient(state.keyFilename, state.projectId)

  try {
    await storage
      .bucket(state.deploymentBucket)
      .file(state.sourceArchiveFilename)
      .delete()
  } catch (err) {
    console.error('Error in deleting source code archive object file: ', err.message)
  }

  try {
    await storage.bucket(state.deploymentBucket).delete()
  } catch (err) {
    console.error('Error in deleting deployment bucket: ', err.message)
  }

  const authClient = await getAuthClient(state.keyFilename)
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

async function patchFunction(
  {
    name,
    description,
    entryPoint,
    timeout,
    availableMemoryMb,
    labels,
    sourceArchiveUrl,
    sourceRepository,
    sourceUploadUrl,
    httpsTrigger,
    eventTrigger,
    runtime,
    projectId,
    locationId,
    keyFilename,
    environmentVariables
  },
  state,
  archiveRes,
  updateMask
) {
  const location = `projects/${projectId}/locations/${locationId}`
  const authClient = await getAuthClient(keyFilename)
  if (authClient) {
    const resAuth = await authClient.authorize()
    if (resAuth) {
      if (!sourceUploadUrl && !sourceRepository) {
        sourceArchiveUrl = archiveRes.sourceArchiveUrl
      }
      // TODO: Dynamically assign one of: sourceUploadUrl, sourceRepository or sourceArchiveUrl
      const params = {
        name: `${location}/functions/${name}`,
        updateMask,
        resource: {
          description,
          entryPoint,
          timeout,
          availableMemoryMb,
          labels,
          sourceArchiveUrl,
          environmentVariables,
          httpsTrigger,
          eventTrigger,
          runtime
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

async function deployFunction(inputs) {
  let outputs
  const resCreate = await createFunction(inputs)
  if (resCreate.status === 200) {
    const resGet = await getFunction(inputs)
    outputs = { ...resCreate, ...resGet }
  }
  return outputs
}

async function updateFunction(inputs, state, zipRes, updateMask) {
  let outputs
  const resPatch = await patchFunction(inputs, state, zipRes, updateMask)
  if (resPatch.status === 200) {
    const resGet = await getFunction(inputs)
    outputs = { ...resPatch, ...resGet }
  }
  return outputs
}

// "public" functions
async function deploy(inputs, context) {
  let outputs = context.state
  const componentData = compareInputsToState(inputs, context.state)
  const inputsToRecreate = ['name', 'locationId', 'projectId', 'keyFilename', 'deploymentBucket']
  const inputsToUpdate = ['entryPoint', 'sourceCodePath', 'runtime']

  if (!componentData.hasState) {
    context.log(`Creating Google Cloud Function: '${inputs.name}'...`)
    outputs = await deployFunction(inputs)
  } else if (context.state.name && !inputs.name) {
    context.log(`Removing Google Cloud Function: ${context.state.name}...`)
    await deleteFunction(context.state)
  } else if (componentData.hasState && haveInputsChanged(componentData, inputsToRecreate)) {
    context.log(`Removing Google Cloud Function: ${context.state.name}...`)
    await deleteFunction(context.state)
    context.log(`Creating Google Cloud Function: '${inputs.name}'...`)
    outputs = await deployFunction(inputs)
  } else {
    const zipRes = await zipAndUploadSourceCode(
      inputs.projectId,
      inputs.keyFilename,
      inputs.sourceCodePath,
      inputs.deploymentBucket,
      context.state
    )

    if (
      (componentData.hasState && zipRes.sourceArchiveHash !== context.state.sourceArchiveHash) ||
      haveInputsChanged(componentData, inputsToUpdate)
    ) {
      context.log(`Updating Google Cloud Function: ${inputs.name}...`)
      const keys = componentData.keys || []
      let updateMask = generateUpdateMask(keys)
      if (zipRes.sourceArchiveHash !== context.state.sourceArchiveHash) {
        keys.push('sourceArchiveUrl')
        updateMask = generateUpdateMask(keys)
      }
      outputs = await updateFunction(inputs, context.state, zipRes, updateMask)
    }
  }

  context.saveState({ ...inputs, ...outputs })
  return outputs
}

async function remove(inputs, context) {
  if (!context.state.name) return {}

  try {
    context.log(`Removing Google Cloud Function: '${inputs.name}'...`)
    await deleteFunction(context.state)
  } catch (e) {
    if (!e.message.includes('does not exist')) {
      throw new Error(e)
    }
  }

  context.saveState()
  return {}
}

async function info(inputs, context) {
  if (!context.state.name) return {}

  const outputs = context.state
  let resGet = {}

  try {
    resGet = await getFunction(inputs)
  } catch (e) {
    context.log('Error in fetching function: ', e)
  }

  context.saveState({ ...inputs, ...outputs, ...resGet })

  if (context.state.httpsTrigger) {
    context.log(`Function url: ${context.state.httpsTrigger.url}`)
  } else if (context.state.eventTrigger) {
    context.log(`Event Trigger: ${JSON.stringify(context.state.eventTrigger, null, 2)}`)
  }
}

module.exports = {
  deploy,
  remove,
  info
}
