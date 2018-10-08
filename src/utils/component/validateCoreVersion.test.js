import validateCoreVersion from './validateCoreVersion'
import packageData from '../../../package.json'

describe('#validateCoreVersion', () => {
  const componentType = 'my-component'
  it('should return true if core property is missing', () => {
    const isValid = validateCoreVersion(componentType)
    expect(isValid).toEqual(true)
  })

  it('should return true if compatible with core version', () => {
    const isValid = validateCoreVersion(componentType, packageData.version)
    expect(isValid).toEqual(true)
  })

  it('should throw an error if not compatible with core version', () => {
    expect(() => validateCoreVersion(componentType, 'incompatible.version')).toThrow(
      `The Serverless Components core is incompatible with component ${componentType}`
    )
  })
})
