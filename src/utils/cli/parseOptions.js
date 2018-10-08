import minimist from 'minimist'

const parseOptions = (argv) => minimist(argv.slice(2))

export default parseOptions
