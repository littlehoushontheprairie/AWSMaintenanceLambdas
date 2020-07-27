const Lightsail = require('aws-sdk/clients/lightsail');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const lightsail = new Lightsail();
const dynamodb = new DynamoDB();

exports.handler = (event) => {
  var params = {
    TableName: 'IPs',
  };
  dynamodb.scan(params, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });

  params = {
    instanceName: process.env['instanceName'],
  };

  lightsail.getInstance(params, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });

  // TODO implement
  //   const response = {
  //     statusCode: 200,
  //     body: JSON.stringify(params.instanceName),
  //   };
  //   return response;
};
