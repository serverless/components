// const deploy = async (inputs, state, context) => {
//   let outputs = state
//   if (!state.name && inputs.name) {
//     context.log(`Creating site: ${inputs.name}`)
//   } else if (!inputs.name && state.name) {
//     context.log(`Removing site: ${state.name}`)
//   } else if (state.name !== inputs.name) {
//     context.log(`Removing old site: ${state.name}`)
//     context.log(`Re-creating site: ${inputs.name}`)
//   }
//   return outputs
// }
//
// const remove = async (inputs, state, context) => {
//   let outputs = state
//   context.log(`Removing site: ${state.name}`)
//   return outputs
// }
//
// module.exports = {
//   deploy,
//   remove
// }
