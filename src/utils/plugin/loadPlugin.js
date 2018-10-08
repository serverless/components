const loadPlugin = async (pluginPath, context) => {
  const PluginType = await context.loadType(pluginPath)
  return context.construct(PluginType, {})
}

export default loadPlugin
