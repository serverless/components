const deploy = async (inputs, context) => {
  const myRoleOutputs = await context.children.myRole
  console.log(myRoleOutputs)
}

module.exports = {
  deploy
}
