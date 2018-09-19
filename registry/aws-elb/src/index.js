/* eslint-disable no-console */

const AWS = require('aws-sdk')

const ELBv2 = new AWS.ELBv2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

function compareArrays(array1, array2)  {

      array1 = array1.slice();
      array2 = array2.slice();
    if (array1.length === array2.length) {
        array1.sort();
        array2.sort();                         
        return array1.every(function(item, index) {
            return item === array2[index];       
        });                                      
    }
    return false;

}

const setSecurityGroup = async (inputs,arn) => {
      var params = {
           LoadBalancerArn: arn,
           SecurityGroups: inputs.securityGroups };
      ELBv2.setSecurityGroups(params, function(err) {
         if (err) console.log(err, err.stack);
      });
}
const setSubnets = async (inputs,arn) => {
      var params = {
           LoadBalancerArn: arn,
           Subnets: inputs.subnets };
      ELBv2.setSubnets(params, function(err) {
         if (err) console.log(err, err.stack);
      });
}

const setIpAddressType = async (inputs, arn) => {
      var params = {
           LoadBalancerArn: arn,
           IpAddressType: inputs.ipAddressType};
      ELBv2.setIpAddressType(params, function(err) {
         if (err) console.log(err, err.stack);
      });
}
const createELB = async (inputs,context) => {

    var params = {
     Name: inputs.name,
     Subnets: inputs.subnets,
     SecurityGroups: inputs.securityGroups,
     IpAddressType: inputs.ipAddressType,
     Scheme: inputs.scheme,
     Type: inputs.elbtype,
     SubnetMappings: inputs.subnetMappings,
     Tags: inputs.tags
     };
    const elb = await ELBv2.createLoadBalancer(params, function(err, data) {
    if (err)  console.log(err, err.stack);
     else     return data;
    }).promise();
    context.saveState({ name: inputs.name,
                    subnets: inputs.subnets,
                    securityGroups: inputs.securityGroups,
                    ipAddressType: elb.LoadBalancers[0]["IpAddressType"],
                    scheme: elb.LoadBalancers[0]["Scheme"],
                    elbtype: elb.LoadBalancers[0]["Type"],
                    subnetMappings: inputs.subnetMappings,
                    arn: elb.LoadBalancers[0]["LoadBalancerArn"]
                    })

    return context.state.arn
}
const deploy = async (inputs, context) => {

    const state  = context.state
    if (!state.name && inputs.name) {
    context.log(`Creating ELb: '${inputs.name}'`)
    const arn = await createELB(inputs,context)
     return { arn: arn }
  }
    if (state.name !== inputs.name || state.elbtype !== inputs.elbtype && inputs.elbtype || state.scheme !== inputs.scheme && inputs.scheme)
   {
      context.log("changing name or elbtype or scheme forces new resource")
      await remove(inputs,context)
      context.log(`Creating ELb: '${inputs.name}'`)
      const arn = await createELB(inputs,context)
       return { arn: arn }
   }
 if (!compareArrays(state.securityGroups,inputs.securityGroups)) {
    await setSecurityGroup(inputs, state.arn)
    context.log(`security group updated ELB: '${state.name}'`)
    state.securityGroups = inputs.securityGroups
   }
 if (inputs.subnets && !compareArrays(state.subnets,inputs.subnets) || inputs.subnetMappings && !compareArrays(state.subnetMappings,inputs.subnetMappings)) {
    await setSubnets(inputs, state.arn)
    state.subnets = inputs.subnets
    context.log(`subnets updated ELB: '${state.name}'`)
    state.subnetMappings = inputs.subnetMappings
  }
 if (state.ipAddressType !== inputs.ipAddressType && inputs.ipAddressType) {
    await setIpAddressType(inputs, state.arn)
    context.log(`ipAddressType updated ELB: '${state.name}'`)
    state.ipAddressType = inputs.ipAddressType
   }
 return { arn: state.arn }
}

const deleteELB = async (arn) => {

  var params = { LoadBalancerArn: arn };
  ELBv2.deleteLoadBalancer(params, function(err) {
     if (err) console.log(err, err.stack);
 });
}

const remove = async (inputs, context) => {

 const { state } = context
 context.log(`Deleting ELB: '${state.name}'`)
 await deleteELB(state.arn)
 context.saveState()
 return {}
}
module.exports = {
    deploy,
    remove
}  
