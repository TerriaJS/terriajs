/* Amplify Params - DO NOT EDIT
	ENV
	FUNCTION_ADDEXAMPLESTORY_NAME
	REGION
Amplify Params - DO NOT EDIT *//*
  this file will loop through all js modules which are uploaded to the lambda resource,
  provided that the file names (without extension) are included in the "MODULES" env variable.
  "MODULES" is a comma-delimmited string.
*/
const moduleNames = process.env.MODULES.split(',');
const modules = moduleNames.map(name => require(`./${name}`));

exports.handler = async (event, context, callback) => {
  const responses = [];
  for (let i = 0; i < modules.length; i += 1) {
    const { handler } = modules[i];
    const response = await handler(event, context, callback);

    console.log("The response was: " + JSON.stringify(response, null, 2));
    // We assume a sucessful module returns a status 200 code
    if (response.statusCode !== 200) {
      throw Error(JSON.stringify(response, null, 2));
    } else {
      responses.push(response.body);
    }
  }
  return {
    statusCode: 200,
    messages: responses
  };
};
