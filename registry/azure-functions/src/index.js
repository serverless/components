async function createFunction(
  { name, resourceGroup, runtime, description, env, root },
  { projectPath },
  role) {
    const path = root || projectPath;
    const pkg = await pack(path);

    // TODO: Create resource group
    // TODO: Create storage account
    // TODO: Create App Service Plan (consumption)
    // TODO: Create Azure Function

    const res = {};
    return res;
  }

async function deploy(inputs, context) {
  let outputs = {};
  const role = {
   spName: inputs.servicePrincipalName,
   spPassword: inputs.servicePrincipalPassword
  };

  // TODO: call the default Azure Role component

  let inputNameResourceUrl = generateResourceUrl(name);
  let contextNameResourceUrl = generateResourceUrl(context.state.name)

  if(inputNameResourceUrl && !contextNameResourceUrl) {
    context.log(`Created Function: ${inputs.name}`);
    outputs = await createFunction(inputs, context, role);
  }
}

async function remove(inputs, context) {
  
}

module.exports = {
    deploy,
    remove
  }