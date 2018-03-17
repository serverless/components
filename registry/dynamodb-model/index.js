/* eslint-disable no-console */

const dynamo = require('dynamodb')
const Joi = require('joi')
const util = require('util')

dynamo.AWS.config.update({ region: 'us-east-1' })

const findTableByName = (tables, tableName) => { // eslint-disable-line arrow-body-style
  return tables.filter((table) => (table.name === tableName))[0]
}

const findOutputTableByName = (tables, tableName) => { // eslint-disable-line arrow-body-style
  return tables.filter((table) => (table[tableName]))[0]
}

const removeOutputTableByName = (tables, tableName) => { // eslint-disable-line arrow-body-style
  return { ddbtables: [ tables.filter((table) => (!table[tableName]))[0] ] }
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
  const nativeSchema = (vSchema) ? convertInputSchemaToNativeSchema(vSchema) : null
  let params = {
    hashKey: table.hashKey,
    rangeKey: table.rangeKey,
    schema: nativeSchema
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

const createTables = async (inputs) => {
  const allTables = inputs.tables.map(async (table) => {
    const tableName = table.name

    const model = defineTable(table)
    const createTableAsync = util.promisify(model.createTable)
    return createTableAsync({})
      .then((data) => {
        console.log(`Created table: '${tableName}'`)
        const obj = {}
        obj[tableName] = data
        return obj
      })
      .catch((err) => {
        console.log(`Error creating table: '${tableName}'\n${err.message}`)
      })
  })

  return Promise.all(allTables).then((ddbtables) => {
    const outputs = {
      ddbtables
    }
    return outputs
  })
}

const deleteTable = (state, tableName) => {
  const table = findOutputTableByName(state.ddbtables, tableName)
  const model = defineTable(table)
  if (model) {
    model.deleteTable((err) => {
      if (err) {
        console.log(`Error deleting table: '${tableName}'\n${err.message}`)
        throw err
      } else {
        console.log(`Deleted table: '${tableName}'`)
      }
    })
  }
  return table
}

const insertItem = (state, tableName, data) => {
  const table = findTableByName(state.tables, tableName)
  const itemData = JSON.parse(data)
  const model = defineTable(table)
  let modelDataAttrs = {}
  if (model) {
    model.create(itemData, (err, modelIns) => {
      if (err) {
        console.log(`Error inserting item to table: '${table.name}'\n${err.message}`)
      } else {
        modelDataAttrs = JSON.stringify(modelIns.attrs)
        console.log(`Item inserted to table: '${table.name}'\n${modelDataAttrs}`)
      }
    })
  }
  return modelDataAttrs
}

const deleteItem = (state, tableName, data) => {
  const table = findTableByName(state.tables, tableName)
  const keyData = JSON.parse(data)
  const model = defineTable(table)
  if (model) {
    model.destroy(keyData, (err) => {
      if (err) {
        console.log(`Error deleting item from table: '${table.name}'\n${err.message}`)
      } else {
        console.log(`Item deleted from table: '${table.name}'`)
      }
    })
  }
  return {}
}

const getItem = (state, tableName, data) => {
  const table = findTableByName(state.tables, tableName)
  const keyData = JSON.parse(data)
  const model = defineTable(table)
  let modelDataAttrs = {}
  if (model) {
    model.get(keyData, (err, modelIns) => {
      if (err) {
        console.log(`Error retrieving item from table: '${table.name}'\n${err.message}`)
      } else {
        modelDataAttrs = JSON.stringify(modelIns.attrs)
        console.log(`Item retrieved from table: '${table.name}'\n${modelDataAttrs}`)
      }
    })
  }
  return modelDataAttrs
}

// Public methods
const deploy = async (inputs, context) => {
  let outputs = context.state

  if (!context.state ||
      !context.state.tables ||
      context.state.tables.length === 0) {
    context.log('Creating table(s)...')
    try {
      outputs = await createTables(inputs)
      context.saveState({ ...inputs, ...outputs })
    } catch (err) {
      console.log('Error in creating table(s)', err)
    }
  }
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.tables ||
       context.state.tables.length === 0) return {}

  if (context.options && context.options.tablename) {
    const tableName = context.options.tablename
    // if table does not exist in state -> ddbtables, bail
    if (!findOutputTableByName(context.state.ddbtables, tableName)) {
      context.log(`Table '${tableName}' does not exist`)
      return {}
    }
    // remove table
    context.log(`Removing table: '${tableName}'`)
    try {
      deleteTable(context.state, tableName)
      // Delete output state only for the specified table
      const ddbTables = removeOutputTableByName(context.state.ddbtables, tableName)
      context.saveState({ ...inputs, ...ddbTables })
    } catch (err) {
      context.log(`Error in removing table: '${tableName}'\n${err}`)
    }
  } else {
    context.log('Incorrect or insufficient parameters. \nUsage: remove --tablename <tablename>')
  }

  return {}
}

const insert = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.tables ||
       context.state.tables.length === 0) return {}

  if (context.options && context.options.tablename && context.options.itemdata) {
    outputs = insertItem(context.state, context.options.tablename, context.options.itemdata)
  } else {
    context.log('Incorrect or insufficient parameters. \nUsage: insert --tablename <tablename> --itemdata <data in json format>')
  }
  return outputs
}

const destroy = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.tables ||
       context.state.tables.length === 0) return {}

  if (context.options && context.options.tablename && context.options.keydata) {
    outputs = deleteItem(context.state, context.options.tablename, context.options.keydata)
  } else {
    context.log('Incorrect or insufficient parameters. \nUsage: destroy --tablename <tablename> --keydata <hashkey and rangekey key/value pairs in json format>')
  }
  return outputs
}

const get = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.tables ||
       context.state.tables.length === 0) return {}

  if (context.options && context.options.tablename && context.options.keydata) {
    outputs = getItem(context.state, context.options.tablename, context.options.keydata)
  } else {
    context.log('Incorrect or insufficient parameters. \nUsage: get --tablename <tablename> --keydata <hashkey and rangekey key/value pairs in json format>')
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
