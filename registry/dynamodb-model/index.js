/* eslint-disable no-console */

const dynamo = require('dynamodb')
const Joi = require('joi')

dynamo.AWS.config.update({ region: 'us-east-1' })

const findTableByName = (tables, tableName) => {
  const t = tables.map((table) => { // eslint-disable-line array-callback-return, consistent-return
    if (table.name === tableName) return table // eslint-disable-line max-len
  })
  return t[0]
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

const defineTable = (name, vHashKey, vRangeKey, vSchema, options) => {
  const nativeSchema = (vSchema) ? convertInputSchemaToNativeSchema(vSchema) : null
  let params = {
    hashKey: vHashKey,
    rangeKey: vRangeKey,
    schema: nativeSchema
  }
  params = { ...params, ...options }

  // define the table schema
  return dynamo.define(name, params)
}

const defineTables = (inputs) => {
  inputs.tables.forEach((table) => {
    defineTable(
      table.name,
      table.hashKey,
      table.rangeKey,
      table.schema,
      table.options
    )
  })
}

const defineAndCreateTables = (inputs) => {
  // define all tables
  defineTables(inputs)

  dynamo.createTables({
    // 'BlogPost': {readCapacity: 5, writeCapacity: 10},
  }, (err) => {
    if (err) {
      console.log('Error creating tables: ', err.message)
    } else {
      console.log('All tables have been created')
    }
  })
}

const deleteTable = (table) => {
  const model = defineTable(
    table.name,
    table.hashKey,
    table.rangeKey,
    table.schema,
    table.options
  )
  if (model) {
    model.deleteTable()
  }
}

const insertItem = (table, itemData) => {
  const model = defineTable(
    table.name,
    table.hashKey,
    table.rangeKey,
    table.schema,
    table.options
  )
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

const deleteItem = (table, keyData) => {
  const model = defineTable(
    table.name,
    table.hashKey,
    table.rangeKey,
    table.schema,
    table.options
  )
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

const getItem = (table, keyData) => {
  const model = defineTable(
    table.name,
    table.hashKey,
    table.rangeKey,
    table.schema,
    table.options
  )
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

  context.log('Creating table(s)...')
  try {
    outputs = defineAndCreateTables(inputs)
  } catch (err) {
    context.log('Error in creating table(s): ', err)
  }
  context.saveState({ ...inputs, ...outputs })

  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.tables ||
       context.state.tables.length === 0) return {}

  if (context.options && context.options.tablename) {
    const tableName = context.options.tablename
    const table = findTableByName(context.state.tables, tableName)

    if (table) {
      context.log(`Removing table: '${tableName}'`)
      try {
        deleteTable(table)
        context.saveState({})
      } catch (err) {
        context.log(`Error in removing table: '${context.state.tables[0].name}'\n${err.message}`)
      }
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
    const tableName = context.options.tablename
    const itemData = context.options.itemdata
    const table = findTableByName(context.state.tables, tableName)
    outputs = insertItem(table, JSON.parse(itemData))
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
    const tableName = context.options.tablename
    const keyData = context.options.keydata
    const table = findTableByName(context.state.tables, tableName)
    outputs = deleteItem(table, JSON.parse(keyData))
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
    const tableName = context.options.tablename
    const keyData = context.options.keydata
    const table = findTableByName(context.state.tables, tableName)
    outputs = getItem(table, JSON.parse(keyData))
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
