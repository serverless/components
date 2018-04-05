const { not } = require('ramda')
const forEachIndexed = require('../misc/forEachIndexed')
const graphlib = require('graphlib')

function detectCircularDeps(graph) {
  const isAcyclic = graphlib.alg.isAcyclic(graph)
  if (not(isAcyclic)) {
    const cycles = graphlib.alg.findCycles(graph)
    let msg = [ 'Your serverless.yml file has circular dependencies:' ]
    forEachIndexed((cycle, index) => {
      const [ node1, node2 ] = cycle
      const fromAToB = `${(index += 1)}. ${node1} --> ${node2}`
      const fromBToA = `${node1} <-- ${node2}`
      const padLength = fromAToB.length + 4
      msg.push(fromAToB.padStart(padLength))
      msg.push(fromBToA.padStart(padLength))
    }, cycles)
    msg = msg.join('\n')
    throw new Error(msg)
  }
  return graph
}

module.exports = detectCircularDeps
