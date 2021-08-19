var aws = require('aws-sdk');
var lambda = new aws.Lambda({apiVersion: '2015-03-31'});

exports.handler = async (event, context, callback) => {
    console.log("Invoking lambda function");

    const response = await lambda.invoke({
      FunctionName: process.env.FUNCTION_ADDEXAMPLESTORY_NAME,
      Payload: JSON.stringify({
        userName: event.userName
      })
    }).promise();

    return JSON.parse(response.Payload);
};