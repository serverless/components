import loadTypeMetaFromPath from '../../utils/loadTypeMetaFromPath'

/**
 * @param {string} typePath the file path to look for a serverless config file
 * @param {*} context
 * @returns {{
 *   root: string,
 *   props: string
 * }}
 */
const loadTypeMeta = loadTypeMetaFromPath

export default loadTypeMeta
