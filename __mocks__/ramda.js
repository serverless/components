const ramda = jest.genMockFromModule('ramda')

ramda.equals = jest.fn()

module.exports = ramda
