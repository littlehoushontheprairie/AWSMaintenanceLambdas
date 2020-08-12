const Lightsail = require('aws-sdk/clients/lightsail');
const lightsail = new Lightsail();
const now = new Date();

exports.handler = (event) => {
    lightsail.deleteInstanceSnapshot(
        {
            instanceSnapshotName:
                process.env.instanceName +
                '-' +
                process.env.recurrence +
                '-snapshot'
        },
        function (err, data) {
            lightsail.createInstanceSnapshot(
                {
                    instanceName: process.env.instanceName,
                    instanceSnapshotName:
                        process.env.instanceName +
                        '-' +
                        process.env.recurrence +
                        '-snapshot',
                    tags: [
                        {
                            key: 'DateGenerated',
                            value:
                                now.getFullYear() +
                                ('0' + (now.getMonth() + 1)).slice(-2) +
                                ('0' + now.getDate()).slice(-2)
                        }
                    ]
                },
                function (err, data) {
                    if (err) {
                        return {
                            statusCode: 500,
                            body: JSON.stringify(err.stack)
                        };
                    } else {
                        return {
                            statusCode: 200,
                            body:
                                'Successfully created a ' +
                                process.env.recurrence +
                                ' snapshot for instance, ' +
                                process.env.instanceName
                        };
                    }
                }
            );
        }
    );
};
