const dynamo = require('dynamodb')
const Joi = require('joi')
const util = require('util')

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

const convertUserTypeToJoiType = (credentials, userType) => {
  dynamo.AWS.config.update(credentials)
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

const convertInputSchemaToNativeSchema = (credentials, inputSchema) => {
  const nativeSchema = {}
  let joiType
  Object.keys(inputSchema).forEach((k) => {
    if (Object.prototype.toString.apply(inputSchema[k]) === '[object Object]') {
      joiType = convertUserTypeToJoiType(credentials, inputSchema[k].type)
    } else {
      joiType = convertUserTypeToJoiType(credentials, inputSchema[k])
    }
    if (joiType !== 'badtype') {
      nativeSchema[k] = joiType
    }
  })

  return nativeSchema
}

const defineTable = (credentials, table) => {
  dynamo.AWS.config.update(credentials)
  if (!table) return null

  const vIndexes = table.indexes
  const vSchema = table.schema
  const vOptions = table.options
  const nativeSchema = vSchema ? convertInputSchemaToNativeSchema(credentials, vSchema) : null
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

const createTables = async (instance, context) => {
  const credentials = instance.provider.getCredentials()
  const state = context.getState(instance)
  const ddbtables = state.ddbtables || [] // eslint-disable-line prefer-destructuring
  const allTables = instance.tables.map(async (table) => {
    const tableName = table.name
    // add provisionedThroughput parameters
    let options = {}
    if (table.provisionedThroughput) {
      options = table.provisionedThroughput
    }
    // define schema
    const model = defineTable(credentials, table)
    // create table
    const createTableAsync = util.promisify(model.createTable)
    return createTableAsync(options)
      .then((data) => {
        context.log(`Created table: '${tableName}'`)
        const obj = {}
        obj[tableName] = data
        ddbtables.push(obj)
        const newState = {
          ddbtables
        }
        context.saveState(instance, newState)
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

const deleteTable = async (instance, context, tableName) => {
  const credentials = instance.provider.getCredentials()
  const state = context.getState(instance)
  const table = findTableByName(instance.tables, tableName)
  let ddbTables = state.ddbtables
  const model = defineTable(credentials, table)
  if (model) {
    const deleteTableAsync = util.promisify(model.deleteTable)
    await deleteTableAsync()

    // Delete output state only for the specified table
    ddbTables = removeOutputTableByName(state.ddbtables, tableName)
    context.saveState(instance, { ddbTables })
    context.log(`Deleted table: '${tableName}'`)
  }
  return ddbTables
}

const insertItem = (instance, state, tableName, data) => {
  const credentials = instance.provider.getCredentials()
  const table = findTableByName(instance.tables, tableName)
  const itemData = JSON.parse(data)
  const model = defineTable(credentials, table)
  if (model) {
    return new Promise((resolve, reject) => {
      model.create(itemData, (err, modelIns) => {
        if (err) {
          reject(new Error(`Error inserting item to table: '${table.name}'\n${err.message}`))
        } else {
          const modelDataAttrs = JSON.stringify(modelIns.attrs)
          console.log(`Item inserted to table: '${table.name}'\n${modelDataAttrs}`) // eslint-disable-line
          resolve(modelDataAttrs)
        }
      })
    })
  }
  return Promise.resolve({})
}

const deleteItem = (instance, state, tableName, data) => {
  const credentials = instance.provider.getCredentials()
  const table = findTableByName(instance.tables, tableName)
  const keyData = JSON.parse(data)
  const model = defineTable(credentials, table)
  if (model) {
    return new Promise((resolve, reject) => {
      model.destroy(keyData, (err) => {
        if (err) {
          reject(new Error(`Error deleting item from table: '${table.name}'\n${err.message}`))
        } else {
          console.log(`Item deleted from table: '${table.name}'`) // eslint-disable-line
          resolve()
        }
      })
    })
  }
  return Promise.resolve({})
}

const getItem = (instance, state, tableName, data) => {
  const credentials = instance.provider.getCredentials()
  const table = findTableByName(instance.tables, tableName)
  const keyData = JSON.parse(data)
  const model = defineTable(credentials, table)
  if (model) {
    return new Promise((resolve, reject) => {
      model.get(keyData, (err, modelIns) => {
        if (err) {
          reject(new Error(`Error retrieving item from table: '${table.name}'\n${err.message}`))
        } else {
          const modelDataAttrs = JSON.stringify(modelIns.attrs)
          console.log(`Item retrieved from table: '${table.name}'\n${modelDataAttrs}`) // eslint-disable-line
          resolve(modelDataAttrs)
        }
      })
    })
  }
  return Promise.resolve({})
}

const AwsDynamoDB = {
  async deploy(prevInstance, context) {
    if (this.tables.length > 1) {
      context.log(
        'Cannot deploy multiple tables at this time. Please update your inputs and try again...'
      )
      return
    }
    try {
      await createTables(this, context)
    } catch (err) {
      context.log('Error in creating table(s)', err.message)
    }
  },

  async remove(prevInstance, context) {
    if (!prevInstance.tables || prevInstance.tables.length === 0) return

    // TODO: when multiple tables are allowed, update to delete multiple tables
    const tableName = this.tables[0].name

    let ddbTables = prevInstance.tables
    // if table does not exist in state -> ddbtables, bail
    if (!findOutputTableByName(prevInstance.tables, tableName)) {
      context.log(`Table '${tableName}' does not exist`)
    } else {
      // remove table
      context.log(`Removing table: '${tableName}'`)
      try {
        ddbTables = await deleteTable(this, context, tableName)
      } catch (err) {
        if (!err.message.includes('Requested resource not found: Table:')) {
          throw new Error(err)
        }
      }
    }
    return ddbTables
  },

  async insert(prevInstance, context) {
    if (!prevInstance.tables || prevInstance.tables.length === 0) return {}

    if (context.options && context.options.tablename && context.options.itemdata) {
      return insertItem(this, prevInstance, context.options.tablename, context.options.itemdata)
    } else {
      context.log(
        'Incorrect or insufficient parameters. \nUsage: insert --tablename <tablename> --itemdata <data in json format>'
      )
    }
  },

  async destroy(prevInstance, context) {
    if (!prevInstance.tables || prevInstance.tables.length === 0) return {}

    if (context.options && context.options.tablename && context.options.keydata) {
      return deleteItem(this, prevInstance, context.options.tablename, context.options.keydata)
    } else {
      context.log(
        'Incorrect or insufficient parameters. \nUsage: destroy --tablename <tablename> --keydata <hashkey and rangekey key/value pairs in json format>'
      )
    }
  },

  async getItem(prevInstance, context) {
    if (!prevInstance.tables || prevInstance.tables.length === 0) return {}

    if (context.options && context.options.tablename && context.options.keydata) {
      return getItem(this, context.state, context.options.tablename, context.options.keydata)
    } else {
      context.log(
        'Incorrect or insufficient parameters. \nUsage: get --tablename <tablename> --keydata <hashkey and rangekey key/value pairs in json format>'
      )
    }
  }
}

export default AwsDynamoDB
