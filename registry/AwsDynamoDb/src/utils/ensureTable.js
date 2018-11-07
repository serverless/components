import updateTable from './updateTable'
import createTable from './createTable'

async function ensureTable(func, properties) {
  try {
    await func(properties)
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      // table already exists --> update it...
      await updateTable(properties)
    } else if (error.code === 'ResourceNotFoundException') {
      // table doesn't exist --> create it...
      await createTable(properties)
    } else {
      throw error
    }
  }
}

export default ensureTable
