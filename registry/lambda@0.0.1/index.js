module.exports.deploy = (inputs) => {

    // async logic goes here...
        
        
    console.log('')
    console.log(`Deploying Lambda ${inputs.tableName}`)
    console.log(`Lambda Deployed`)
    console.log('')
    
    const outputs = {
        lambdaArn: 'abc'
    }
    return outputs
}