# Serialization


Notes
- variables do not need to be serialized because they have already been resolved at the end of a deployment (so they not longer exist in the tree)
- we only serialize scalars, plain objects, plain arrays, native js types (Date, ..., ?), Types from the type system
- during deserialization, a type's constructor is not invoked. instead we use Object.create(Type.constructor.prototype)
- The context that is used is always the cores most recent implementation of context. We don't serialize context. CONTEXT MUST REMAIN BACKWARD COMPATIBLE
