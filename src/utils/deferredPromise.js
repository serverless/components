const deferredPromise = () => {
  let rejectPromise
  let resolvePromise
  const promise = new Promise((resolve, reject) => {
    rejectPromise = reject
    resolvePromise = resolve
  })
  promise.reject = rejectPromise
  promise.resolve = resolvePromise
  return promise
}

module.exports = deferredPromise
