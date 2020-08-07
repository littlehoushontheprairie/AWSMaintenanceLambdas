const Lightsail = require('aws-sdk/clients/lightsail');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const lightsail = new Lightsail();
const dynamodb = new DynamoDB();

exports.handler = (event) => {
  let allowIPs = [];

  dynamodb.scan({ TableName: 'IPs' }, function (err, data) {
    if (err) {
      return {
        statusCode: 500,
        body: JSON.stringify(err.stack),
      };
    } else {
      allowIPs = data.Items;

      lightsail.getInstance(
        { instanceName: process.env['instanceName'] },
        function (err, data) {
          if (err) {
            return {
              statusCode: 500,
              body: JSON.stringify(err.stack),
            };
          } else {
            let instancePorts = data.instance.networking.ports;

            instancePorts.forEach((port) => {
              if (
                port.accessFrom &&
                port.accessFrom === 'Custom' &&
                port.protocol.toLowerCase() ===
                  process.env['protocol'].toLowerCase() &&
                port.fromPort === parseInt(process.env['port']) &&
                port.toPort === parseInt(process.env['port'])
              ) {
                delete port['accessDirection'];
                delete port['commonName'];
                delete port['accessFrom'];
                delete port['accessType'];

                lightsail.closeInstancePublicPorts(
                  {
                    instanceName: process.env['instanceName'],
                    portInfo: port,
                  },
                  function (err, data) {
                    if (err) {
                      return {
                        statusCode: 500,
                        body: JSON.stringify(err.stack),
                      };
                    } else {
                      port.cidrs = [];
                      allowIPs.forEach((element) => {
                        port.cidrs.push(element.IP.S + '/32');
                      });

                      lightsail.openInstancePublicPorts(
                        {
                          instanceName: process.env['instanceName'],
                          portInfo: port,
                        },
                        function (err, data) {
                          if (err) {
                            return {
                              statusCode: 500,
                              body: JSON.stringify(err.stack),
                            };
                          } else {
                            return {
                              statusCode: 200,
                              body:
                                'Successfully updated ports for instance, ' +
                                process.env['instanceName'],
                            };
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          }
        }
      );
    }
  });
};
