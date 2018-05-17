/* eslint-disable no-console */

const dynamo = require('dynamodb')
const Joi = require('joi')
const util = require('util')

dynamo.AWS.config.update({ region: 'us-east-1' })

const findTableByName = (tables, tableName) => {
  // eslint-disable-line arrow-body-style
  if (!tables || tables.length === 0) return {}
  return tables.filter((table) => table.name === tableName)[0]
}

const findOutputTableByName = (tables, tableName) => {
  // eslint-disable-line arrow-body-style
  if (!tables || tables.length === 0) return {}
  return tables.filter((table) => table[tableName])[0]
}

const removeOutputTableByName = (tables, tableName) => {
  // eslint-disable-line arrow-body-style
  if (!tables || tables.length === 0) return { ddbtables: [] }
  const val = tables.filter((table) => !table[tableName])[0]
  if (val) {
    return { ddbtables: [val] }
  }
  return { ddbtables: [] }
}

const convertUserTypeToJoiType = (userType) => {
  let joiType

  // TODO: add options (defaults, and other Joi magic)

  switch (userType) {
    case 'string':
      joiType = Joi.string()
      break
    case 'number':
      joiType = Joi.number()
      break
    case 'binary':
      joiType = Joi.binary()
      break
    case 'boolean':
      joiType = Joi.boolean()
      break
    case 'date':
      joiType = Joi.date()
      break
    // special types
    case 'uuid':
      joiType = dynamo.types.uuid()
      break
    case 'stringset':
      joiType = dynamo.types.stringSet()
      break
    case 'numberset':
      joiType = dynamo.types.numberSet()
      break
    case 'binaryset':
      joiType = dynamo.types.binarySet()
      break
    case 'email':
      joiType = Joi.string().email()
      break
    case 'username': // needs 'birthyear' as well
      joiType = Joi.string().username()
      break
    case 'password':
      joiType = Joi.string().password()
      break
    case 'birthyear':
      joiType = Joi.string().birthyear()
      break
    default:
      joiType = 'badtype'
  }

  return joiType
}

const convertInputSchemaToNativeSchema = (inputSchema) => {
  const nativeSchema = {}
  let joiType
  Object.keys(inputSchema).forEach((k) => {
    if (Object.prototype.toString.apply(inputSchema[k]) === '[object Object]') {
      joiType = convertUserTypeToJoiType(inputSchema[k].type)
    } else {
      joiType = convertUserTypeToJoiType(inputSchema[k])
    }
    if (joiType !== 'badtype') {
      nativeSchema[k] = joiType
    }
  })

  return nativeSchema
}

const defineTable = (table) => {
  if (!table) return null

  const vIndexes = table.indexes
  const vSchema = table.schema
  const vOptions = table.options
  const nativeSchema = vSchema ? convertInputSchemaToNativeSchema(vSchema) : null
  let params = {
    hashKey: table.hashKey,
    rangeKey: table.rangeKey,
    schema: nativeSchema,
    tableName: table.name
  }
  if (vIndexes) {
    params = { ...params, indexes: vIndexes }
  }
  if (vOptions) {
    params = { ...params, ...vOptions }
  }

  // define the table schema
  return dynamo.define(table.name, params)
}

const createTables = async (inputs, context) => {
  const ddbtables = context.state.ddbtables || [] // eslint-disable-line prefer-destructuring
  const allTables = inputs.tables.map(async (table) => {
    const tableName = table.name
    // add provisionedThroughput parameters
    let options = {}
    if (table.provisionedThroughput) {
      options = table.provisionedThroughput
    }
    // define schema
    const model = defineTable(table)
    // create table
    const createTableAsync = util.promisify(model.createTable)
    return createTableAsync(options)
      .then((data) => {
        console.log(`Created table: '${tableName}'`)
        const obj = {}
        obj[tableName] = data
        ddbtables.push(obj)
        const outputs = {
          ddbtables
        }
        context.saveState(outputs)
        return obj
      })
      .catch((err) => {
        throw err
      })
  })

  return Promise.all(allTables).then((results) => {
    const outputs = {
      results
    }
    return outputs
  })
}

const deleteTable = async (inputs, context, tableName) => {
  const table = findTableByName(inputs.tables, tableName)
  let ddbTables = context.state.ddbtables
  const model = defineTable(table)
  if (model) {
    const deleteTableAsync = util.promisify(model.deleteTable)
    await deleteTableAsync()

    // Delete output state only for the specified table
    ddbTables = removeOutputTableByName(context.state.ddbtables, tableName)
    context.saveState({ ddbTables })
    console.log(`Deleted table: '${tableName}'`)
  }
  return ddbTables
}

const insertItem = (inputs, state, tableName, data) => {
  const table = findTableByName(inputs.tables, tableName)
  const itemData = JSON.parse(data)
  const model = defineTable(table)
  if (model) {
    return new Promise((resolve, reject) => {
      model.create(itemData, (err, modelIns) => {
        if (err) {
          reject(new Error(`Error inserting item to table: '${table.name}'\n${err.message}`))
        } else {
          const modelDataAttrs = JSON.stringify(modelIns.attrs)
          console.log(`Item inserted to table: '${table.name}'\n${modelDataAttrs}`)
          resolve(modelDataAttrs)
        }
      })
    })
  }
  return Promise.resolve({})
}

const deleteItem = (inputs, state, tableName, data) => {
  const table = findTableByName(inputs.tables, tableName)
  const keyData = JSON.parse(data)
  const model = defineTable(table)
  if (model) {
    return new Promise((resolve, reject) => {
      model.destroy(keyData, (err) => {
        if (err) {
          reject(new Error(`Error deleting item from table: '${table.name}'\n${err.message}`))
        } else {
          console.log(`Item deleted from table: '${table.name}'`)
          resolve()
        }
      })
    })
  }
  return Promise.resolve({})
}

const getItem = (inputs, state, tableName, data) => {
  const table = findTableByName(inputs.tables, tableName)
  const keyData = JSON.parse(data)
  const model = defineTable(table)
  if (model) {
    return new Promise((resolve, reject) => {
      model.get(keyData, (err, modelIns) => {
        if (err) {
          reject(new Error(`Error retrieving item from table: '${table.name}'\n${err.message}`))
        } else {
          const modelDataAttrs = JSON.stringify(modelIns.attrs)
          console.log(`Item retrieved from table: '${table.name}'\n${modelDataAttrs}`)
          resolve(modelDataAttrs)
        }
      })
    })
  }
  return Promise.resolve({})
}

// Public methods
const deploy = async (inputs, context) => {
  let outputs = context.state

  if (
    !context.state ||
    !context.state.ddbtables ||
    context.state.ddbtables.length !== inputs.tables.length
  ) {
    // TODO: Fix creating multiple tables on deploy. Restrict to one table for now
    if (inputs.tables.length > 1) {
      context.log(
        'Cannot deploy multiple tables at this time. Please update your inputs and try again...'
      )
      return {}
    }
    try {
      outputs = await createTables(inputs, context)
    } catch (err) {
      console.log('Error in creating table(s)', err.message)
    }
  }
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.ddbtables || context.state.ddbtables.length === 0) return {}

  let tableName
  if (context.options && context.options.tablename) {
    tableName = context.options.tablename
  } else {
    // TODO: when multiple tables are allowed, update to delete multiple tables
    tableName = inputs.tables[0].name
  }
  let ddbTables = context.state.ddbtables
  // if table does not exist in state -> ddbtables, bail
  if (!findOutputTableByName(context.state.ddbtables, tableName)) {
    context.log(`Table '${tableName}' does not exist`)
  } else {
    // remove table
    context.log(`Removing table: '${tableName}'`)
    try {
      ddbTables = await deleteTable(inputs, context, tableName)
    } catch (err) {
      if (!err.message.includes('Requested resource not found: Table:')) {
        throw new Error(err)
      }
    }
  }

  return ddbTables
}

const insert = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.ddbtables || context.state.ddbtables.length === 0) return {}

  if (context.options && context.options.tablename && context.options.itemdata) {
    outputs = await insertItem(
      inputs,
      context.state,
      context.options.tablename,
      context.options.itemdata
    )
  } else {
    context.log(
      'Incorrect or insufficient parameters. \nUsage: insert --tablename <tablename> --itemdata <data in json format>'
    )
  }
  return outputs
}

const destroy = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.ddbtables || context.state.ddbtables.length === 0) return {}

  if (context.options && context.options.tablename && context.options.keydata) {
    outputs = await deleteItem(
      inputs,
      context.state,
      context.options.tablename,
      context.options.keydata
    )
  } else {
    context.log(
      'Incorrect or insufficient parameters. \nUsage: destroy --tablename <tablename> --keydata <hashkey and rangekey key/value pairs in json format>'
    )
  }
  return outputs
}

const get = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.ddbtables || context.state.ddbtables.length === 0) return {}

  if (context.options && context.options.tablename && context.options.keydata) {
    outputs = await getItem(
      inputs,
      context.state,
      context.options.tablename,
      context.options.keydata
    )
  } else {
    context.log(
      'Incorrect or insufficient parameters. \nUsage: get --tablename <tablename> --keydata <hashkey and rangekey key/value pairs in json format>'
    )
  }
  return outputs
}

module.exports = {
  deploy,
  remove,
  insert,
  destroy,
  get
}
