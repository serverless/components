// manage state
// deploy component if it doesnt have index.js

const path = require('path')
const R = require('ramda')
const YAML = require('yamljs')
const fs = require('fs')

const getNestedComponentsRoots = (componentNames = []) => componentNames.map((componentName) => path.join(process.cwd(), '..', 'registry', componentName))

const deploy = (componentRoot = process.cwd(), parentInputs = {}) => {
    const slsJson = YAML.parse(String(fs.readFileSync(path.join(componentRoot, 'serverless.yml'))))
    const inputs = R.mergeDeepRight(slsJson.inputs, parentInputs)
    const nestedComponentsRoots = getNestedComponentsRoots(slsJson.components)
    
    // const nestedComponentsOutputs = R.reduce((accum, componentRoot) => {
    //     const nestedComponentOutputs = deploy(componentRoot, inputs)
    //     accum = R.mergeDeepRight(accum, nestedComponentOutputs)
    //     return accum
    // }, {}, nestedComponentsRoots)
    
    return R.reduce((accumPromised, componentRoot) => {
        return Promise.resolve(deploy(componentRoot, inputs)).then(nestedComponentOutputs => {
            return Promise.resolve(accumPromised).then((accum) => {
                return R.mergeDeepRight(accum, nestedComponentOutputs)
            })
        })
    }, Promise.resolve({}), nestedComponentsRoots)
    .then(nestedComponentsOutputs => {
        const thisComponentLogic = require(path.join(componentRoot, 'index.js'))
        return Promise.resolve(thisComponentLogic.deploy(inputs)).then(outputs => R.mergeDeepRight(outputs, nestedComponentsOutputs))
    })
    

}

const commands = {
    deploy: deploy,
}

const command = process.argv[2]

commands[command]().then(outputs => {
    console.log('\nOutputs:')
    R.forEachObjIndexed((value, key) => {
        console.log(`  ${key}: ${value}`)
    }, outputs)
    console.log('')
})