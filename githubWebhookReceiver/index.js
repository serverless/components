module.exports.deploy = (inputs) => {
   
    // async logic goes here...
        
        
    console.log('')
    console.log(`Github Webhook Receiver Deployed`)
    console.log('')

    const outputs = {
        githubwebhook: 'abc'
    }
    return Promise.resolve(outputs)
}