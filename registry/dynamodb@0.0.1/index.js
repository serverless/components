// first time: tableName: repos => tableName: { old: null, new: 'repos'}
// second time tableName: my-repos => { old: 'repos', new: 'my-repos' }
// third time tableName: my-repos, indexKey: repoName => indexKey: { old: null, new: 'repoName'}
//
const AWS = require('aws-sdk')

const createTable = (tableName) => {
    // todo get api keys
    const dynamodb = new AWS.DynamoDB()
    const params = {}
}

const deleteTable = (tableName) => {
    
}

module.exports.deploy = (inputs, state) => {
    inputs = {
        tableName: 'repos'
    }
    state = {
        tableName: 'my-repos'
    }
    // if noStateFile
    //   createTable
    //   createStateFile
    // else
    //   if stateFileMatchesInput
    //     do nothing. no updates needed
    //   else
    //     getStateFileValue
    //     deleteStateFileTable
    //     createNewInputTable
    //     updateStateFile

    // async logic goes here...
        
        
    console.log('')
    console.log(`Deploying Table ${inputs.tableName}`)
    console.log(`Table ${inputs.tableName} Deployed`)
    console.log('')
    const outputs = {
        table: inputs.tableName
    }
    return Promise.resolve(outputs)
}