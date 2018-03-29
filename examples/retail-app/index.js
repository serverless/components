const { readFile } = require('fs')

module.exports = {
  async deploy(inputs, context) {
    const productsDb = await context.children.productsDb
    const products = await new Promise((resolve, reject) =>
      readFile('data/products.json', (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(JSON.parse(data))
        }
      }))

    const tablename = `products-${context.serviceId}`
    const insertItem = (triesLeft, wait) => (p) =>
      // TODO: fix underlying issues and make this less hacky
      productsDb.fns
        .insert(null, {
          log: context.log,
          state: productsDb.inputs,
          options: {
            tablename,
            itemdata: p
          }
        })
        .then(async () => {
          console.log('checking item')
          const gottenData = await productsDb.fns.get(null, {
            log: context.log,
            state: productsDb.inputs,
            options: {
              tablename,
              keydata: `{"id":${JSON.parse(p).id}}`
            }
          })
          console.log('got item', gottenData)
          const item = gottenData instanceof Object ? gottenData : JSON.parse(gottenData)

          if (!item.id && triesLeft > 0) {
            console.log('trying again')
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                const doInsert = insertItem(triesLeft - 1, wait)(p)
                doInsert.then(resolve, reject)
              }, wait)
            })
          }
          return null
        })

    const insertions = products.map(JSON.stringify).map(insertItem(30, 15000))
    await Promise.all(insertions)
  }
}
