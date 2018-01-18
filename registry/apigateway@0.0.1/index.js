module.exports.deploy = (inputs) => {
    
    // async logic goes here...

    console.log('')
    console.log(`Deploying API Gateway Endpoint ${inputs.tableName}`)
    console.log(`API Gateway Deployed`)
    console.log('')
    
    const outputs = {
        endpoint: 'https://aws.com/webhook',
        method: inputs.method
    }
    return Promise.resolve(outputs)
}