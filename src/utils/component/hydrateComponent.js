const hydrateComponent = (component, context) => {
  const state = context.getState(component)
  component.hydrate(state, context)
  if (!component.instanceId) {
    throw new Error(
      `A component must set an instanceId before or during hydrate. This component did not set one ${component.toString()}. You may need to call the super method of hydrate to ensure the instanceId is set or set one yourself.`
    )
  }
  return component
}

export default hydrateComponent
