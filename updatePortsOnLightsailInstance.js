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
                body: JSON.stringify(err.stack)
            };
        } else {
            allowIPs = data.Items;

            lightsail.getInstance(
                { instanceName: process.env.instanceName },
                function (err, data) {
                    if (err) {
                        return {
                            statusCode: 500,
                            body: JSON.stringify(err.stack)
                        };
                    } else {
                        let instancePorts = data.instance.networking.ports;
                        let customPorts = [];

                        instancePorts.forEach((port) => {
                            if (
                                port.accessFrom &&
                                port.accessFrom === 'Custom'
                            ) {
                                delete port['accessDirection'];
                                delete port['commonName'];
                                delete port['accessFrom'];
                                delete port['accessType'];
                                customPorts.push(port);
                            }
                        });

                        updatePorts(customPorts, allowIPs);
                    }
                }
            );
        }
    });
};

function updatePorts(listOfPorts, listOfIPs) {
    if (listOfPorts.length === 0) {
        return {
            statusCode: 200,
            body:
                'Successfully updated ports for instance, ' +
                process.env.instanceName
        };
    }

    let port = listOfPorts.pop();

    lightsail.closeInstancePublicPorts(
        {
            instanceName: process.env.instanceName,
            portInfo: port
        },
        function (err, data) {
            if (err) {
                return {
                    statusCode: 500,
                    body: JSON.stringify(err.stack)
                };
            } else {
                port.cidrs = [];
                listOfIPs.forEach((element) => {
                    port.cidrs.push(element.IP.S + '/32');
                });

                lightsail.openInstancePublicPorts(
                    {
                        instanceName: process.env.instanceName,
                        portInfo: port
                    },
                    function (err, data) {
                        if (err) {
                            return {
                                statusCode: 500,
                                body: JSON.stringify(err.stack)
                            };
                        } else {
                            return updatePorts(listOfPorts, listOfIPs);
                        }
                    }
                );
            }
        }
    );
}
