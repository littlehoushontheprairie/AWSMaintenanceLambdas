const S3 = require('aws-sdk/clients/s3');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const s3 = new S3();
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

            s3.getBucketPolicy(
                {
                    Bucket: process.env.bucket
                },
                function (err, data) {
                    if (err) {
                        return {
                            statusCode: 500,
                            body: JSON.stringify(err.stack)
                        };
                    } else {
                        let policy = JSON.parse(data.Policy);
                        let listOfIPs = [];

                        allowIPs.forEach((element) => {
                            listOfIPs.push(element.IP.S);
                        });

                        policy.Statement[0].Condition.IpAddress[
                            'aws:SourceIp'
                        ] = listOfIPs;

                        s3.putBucketPolicy(
                            {
                                Bucket: process.env.bucket,
                                Policy: JSON.stringify(policy)
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
                                            'Successfully updated policy for bucket, ' +
                                            process.env.bucket
                                    };
                                }
                            }
                        );
                    }
                }
            );
        }
    });
};
