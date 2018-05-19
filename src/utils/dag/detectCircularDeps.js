const { forEachIndexed } = require('@serverless/utils')
const graphlib = require('graphlib')
const { not } = require('ramda')

function detectCircularDeps(graph) {
  const isAcyclic = graphlib.alg.isAcyclic(graph)
  if (not(isAcyclic)) {
    const cycles = graphlib.alg.findCycles(graph)
    let msg = ['Your serverless.yml file has circular dependencies:']
    forEachIndexed((cycle, index) => {
      let fromAToB = cycle.join(' --> ')
      fromAToB = `${(index += 1)}. ${fromAToB}`
      const fromBToA = cycle.reverse().join(' <-- ')
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
