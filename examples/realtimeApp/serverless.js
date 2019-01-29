// todo update!!!!

const realtimeApp = require('../../components/realtimeApp/serverless')

const realtimeAppInputs = {
  name: 'realtimeApp',
  stage: 'dev',
  description: 'Realtime App',
  frontend: {
    code: './frontend',
    assets: '.',
    envFileLocation: './src/env.js',
    env: {},
    buildCmd: null
  },
  backend: {
    code: './backend',
    memory: 512,
    timeout: 10,
    env: {}
  }
}

const deploy = async (inputs, cli) => {
  // user could optionally merge inputs coming from
  // the cli with the inputs he defined above to make
  // his new higher level component configurable
  // before publishing, like we're doing in the registry
  //
  // const config = { realtimeAppInputs, ...inputs }

  const outputs = await realtimeApp.deploy(realtimeAppInputs, cli)
  // we passed the cli object in that case to output everything
  // from the realtimeApp component. Alternatively, the user
  // could define his own cli experience here and not pass the cli object,
  // in that case, all child component will only be able to update the status
  // but all their logs and cli outputs would be silenced

  return outputs
}

const remove = async (inputs, cli) => realtimeApp.remove(realtimeAppInputs, cli)

const connect = async (inputs, cli) => realtimeApp.connect({ ...realtimeAppInputs, ...inputs }, cli)

module.exports = { deploy, remove, connect }
