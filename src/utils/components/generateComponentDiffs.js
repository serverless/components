/*
* Generate Component Diffs
* - Uses a modified version of https://github.com/flitbit/diff
* - Not leveraging the pure OS library because we need to own the diff'ing experience.  It's an API which component authors may rely on greatly.
* - API must stay consistent.
* - Adds "inputs" as first path item for future-proofing.
*  API:
*    change: 'create', 'update', 'delete', 'update_array'
*    path: [ (changed value path as an array of strings) ]
*    previous: (the previous value)
*    current: (the new value)
*    index: (if change: 'update_array', the index of the array item modified)
*    item: (if change: 'update_array', the diff of the modified array item)
*/

/*
* Diff Functionality
*/

function inherits(ctor, superCtor) {
  ctor.super_ = superCtor
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  })
}

function Diff(kind, path) {
  Object.defineProperty(this, 'change', {
    value: kind,
    enumerable: true
  })
  if (path && path.length) {
    Object.defineProperty(this, 'path', {
      value: path,
      enumerable: true
    })
  }
}

function DiffEdit(path, origin, value) {
  DiffEdit.super_.call(this, 'update', path)
  Object.defineProperty(this, 'previous', {
    value: origin,
    enumerable: true
  })
  Object.defineProperty(this, 'current', {
    value: value,
    enumerable: true
  })
}
inherits(DiffEdit, Diff)

function DiffNew(path, value) {
  DiffNew.super_.call(this, 'create', path)
  Object.defineProperty(this, 'current', {
    value: value,
    enumerable: true
  })
}
inherits(DiffNew, Diff)

function DiffDeleted(path, value) {
  DiffDeleted.super_.call(this, 'delete', path)
  Object.defineProperty(this, 'previous', {
    value: value,
    enumerable: true
  })
}
inherits(DiffDeleted, Diff)

function DiffArray(path, index, item) {
  DiffArray.super_.call(this, 'update_array', path)
  Object.defineProperty(this, 'index', {
    value: index,
    enumerable: true
  })
  Object.defineProperty(this, 'item', {
    value: item,
    enumerable: true
  })
}
inherits(DiffArray, Diff)

function realTypeOf(subject) {
  var type = typeof subject
  if (type !== 'object') {
    return type
  }

  if (subject === Math) {
    return 'math'
  } else if (subject === null) {
    return 'null'
  } else if (Array.isArray(subject)) {
    return 'array'
  } else if (Object.prototype.toString.call(subject) === '[object Date]') {
    return 'date'
  } else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
    return 'regexp'
  }
  return 'object'
}

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function hashThisString(string) {
  var hash = 0
  if (string.length === 0) {
    return hash
  }
  for (var i = 0; i < string.length; i++) {
    var char = string.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

// Gets a hash of the given object in an array order-independent fashion
// also object key order independent (easier since they can be alphabetized)
function getOrderIndependentHash(object) {
  var accum = 0
  var type = realTypeOf(object)

  if (type === 'array') {
    object.forEach(function(item) {
      // Addition is commutative so this is order indep
      accum += getOrderIndependentHash(item)
    })

    var arrayString = '[type: array, hash: ' + accum + ']'
    return accum + hashThisString(arrayString)
  }

  if (type === 'object') {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        var keyValueString =
          '[ type: object, key: ' +
          key +
          ', value hash: ' +
          getOrderIndependentHash(object[key]) +
          ']'
        accum += hashThisString(keyValueString)
      }
    }

    return accum
  }

  // Non object, non array
  var stringToHash = '[ type: ' + type + ' ; value: ' + object + ']'
  return accum + hashThisString(stringToHash)
}

function deepDiff(previous, current, changes, prefilter, path, key, stack, orderIndependent) {
  changes = changes || []
  path = path || []
  stack = stack || []
  var currentPath = path.slice(0)
  if (typeof key !== 'undefined' && key !== null) {
    if (prefilter) {
      if (typeof prefilter === 'function' && prefilter(currentPath, key)) {
        return
      } else if (typeof prefilter === 'object') {
        if (prefilter.prefilter && prefilter.prefilter(currentPath, key)) {
          return
        }
        if (prefilter.normalize) {
          var alt = prefilter.normalize(currentPath, key, previous, current)
          if (alt) {
            previous = alt[0]
            current = alt[1]
          }
        }
      }
    }
    currentPath.push(key)
  }

  // Use string comparison for regexes
  if (realTypeOf(previous) === 'regexp' && realTypeOf(current) === 'regexp') {
    previous = previous.toString()
    current = current.toString()
  }

  var ltype = typeof previous
  var rtype = typeof current
  var i, j, k, other

  var ldefined =
    ltype !== 'undefined' ||
    (stack &&
      stack.length > 0 &&
      stack[stack.length - 1].previous &&
      Object.getOwnPropertyDescriptor(stack[stack.length - 1].previous, key))
  var rdefined =
    rtype !== 'undefined' ||
    (stack &&
      stack.length > 0 &&
      stack[stack.length - 1].current &&
      Object.getOwnPropertyDescriptor(stack[stack.length - 1].current, key))

  if (!ldefined && rdefined) {
    changes.push(new DiffNew(currentPath, current))
  } else if (!rdefined && ldefined) {
    changes.push(new DiffDeleted(currentPath, previous))
  } else if (realTypeOf(previous) !== realTypeOf(current)) {
    changes.push(new DiffEdit(currentPath, previous, current))
  } else if (realTypeOf(previous) === 'date' && previous - current !== 0) {
    changes.push(new DiffEdit(currentPath, previous, current))
  } else if (ltype === 'object' && previous !== null && current !== null) {
    for (i = stack.length - 1; i > -1; --i) {
      if (stack[i].previous === previous) {
        other = true
        break
      }
    }
    if (!other) {
      stack.push({ previous: previous, current: current })
      if (Array.isArray(previous)) {
        // If order doesn't matter, we need to sort our arrays
        if (orderIndependent) {
          previous.sort(function(a, b) {
            return getOrderIndependentHash(a) - getOrderIndependentHash(b)
          })

          current.sort(function(a, b) {
            return getOrderIndependentHash(a) - getOrderIndependentHash(b)
          })
        }
        i = current.length - 1
        j = previous.length - 1
        while (i > j) {
          changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, current[i--])))
        }
        while (j > i) {
          changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, previous[j--])))
        }
        for (; i >= 0; --i) {
          deepDiff(
            previous[i],
            current[i],
            changes,
            prefilter,
            currentPath,
            i,
            stack,
            orderIndependent
          )
        }
      } else {
        var akeys = Object.keys(previous)
        var pkeys = Object.keys(current)
        for (i = 0; i < akeys.length; ++i) {
          k = akeys[i]
          other = pkeys.indexOf(k)
          if (other >= 0) {
            deepDiff(
              previous[k],
              current[k],
              changes,
              prefilter,
              currentPath,
              k,
              stack,
              orderIndependent
            )
            pkeys[other] = null
          } else {
            deepDiff(
              previous[k],
              undefined,
              changes,
              prefilter,
              currentPath,
              k,
              stack,
              orderIndependent
            )
          }
        }
        for (i = 0; i < pkeys.length; ++i) {
          k = pkeys[i]
          if (k) {
            deepDiff(
              undefined,
              current[k],
              changes,
              prefilter,
              currentPath,
              k,
              stack,
              orderIndependent
            )
          }
        }
      }
      stack.length = stack.length - 1
    } else if (previous !== current) {
      // previous is contains a cycle at this element and it differs from current
      changes.push(new DiffEdit(currentPath, previous, current))
    }
  } else if (previous !== current) {
    if (!(ltype === 'number' && isNaN(previous) && isNaN(current))) {
      changes.push(new DiffEdit(currentPath, previous, current))
    }
  }
}

function observableDiff(previous, current, observer, prefilter, orderIndependent) {
  var changes = []
  deepDiff(previous, current, changes, prefilter, null, null, null, orderIndependent)
  if (observer) {
    for (var i = 0; i < changes.length; ++i) {
      observer(changes[i])
    }
  }
  return changes
}

function diffInputs(previous, current, prefilter, accum) {
  var observer = accum
    ? function(difference) {
        if (difference) {
          accum.push(difference)
        }
      }
    : undefined
  var changes = observableDiff(previous, current, observer, prefilter)

  // Convert Diff classes to objects
  const flatten = (item) => {
    let object = {}
    object.change = item.change || null
    object.path = item.path || null
    object.previous = item.previous || null
    object.current = item.current || null
    if (item.index) {
      object.index = item.index
    }
    if (item.item) {
      object.item = flatten(item.item)
    }
    return object
  }

  changes = changes.map(flatten)
  return accum ? accum : changes.length ? changes : undefined
}

/*
* Generate Component Diff
*/

const generateComponentDiffs = (previousInputs, newInputs) => {
  const inputDiffs = diffInputs(previousInputs, newInputs)
  return inputDiffs || null
}

module.exports = generateComponentDiffs
