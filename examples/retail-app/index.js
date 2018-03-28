const { readFile } = require('fs')

module.exports = {
  async deploy(inputs, context) {
    const productsDb = await context.children.productsDb
    const products = await (new Promise((resolve, reject) =>
      readFile('data/products.json', (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      }))).then(JSON.parse)
    const insertions = products.map((p) =>
      productsDb.fns.insert(null, {
        state: productsDb.state,
        options: {
          tablename: `products-${context.serviceId}`,
          itemdata: JSON.stringify(p)
        }
      }))
    await Promise.all(insertions)
  }
}
