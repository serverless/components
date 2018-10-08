const isType = (value) =>
  !!value && !!value.class && !!value.constructor && !!value.main && !!value.props && !!value.root

export default isType
