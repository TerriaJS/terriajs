/* Amplify Params - DO NOT EDIT
	API_RECEIPTAPI_GRAPHQLAPIIDOUTPUT
	API_RECEIPTAPI_PAGETABLE_ARN
	API_RECEIPTAPI_PAGETABLE_NAME
	API_RECEIPTAPI_STORYTABLE_ARN
	API_RECEIPTAPI_STORYTABLE_NAME
	ENV
	REGION
	STORAGE_STORYCONTENT_BUCKETNAME
Amplify Params - DO NOT EDIT */
var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });
var s3 = new aws.S3({ apiVersion: '2006-03-01' });
const { storyToInitfile, pageToHTML, replaceBucketUrls, updateHotspots } = require('./convert-story');

const sourceBucket = process.env.STORAGE_STORYCONTENT_BUCKETNAME;
const targetBucket = 'receipt-stories-bucket'; // the public bucket
const targetKey = 'stories';

const getStory = async storyID => {
  const storyItem = await ddb.getItem({
    TableName: process.env.API_RECEIPTAPI_STORYTABLE_NAME,
    Key: {
      id: {S: storyID}
    }
  }).promise();

  if (storyItem && storyItem.Item) {
    // Convert to plain data structure
    const story = aws.DynamoDB.Converter.unmarshall(storyItem.Item);
    return story;
  }
  return null;
};

const getPages = async storyID => {
  // Retrieve all pages linked to the stories
  var params = {
    ExpressionAttributeValues: {
    ":v1": {
        S: storyID
      }
    },
    FilterExpression: "storyID = :v1",
    TableName: process.env.API_RECEIPTAPI_PAGETABLE_NAME,
  };
  const pages = await ddb.scan(params).promise();

  // Convert to plain data structure and sort
  const plainPages = pages.Items.map(item => aws.DynamoDB.Converter.unmarshall(item));
  plainPages.sort((p1, p2) => p1.pageNr - p2.pageNr);
  return plainPages;
};

const writeToBucket = async (data, storyKey, pageKey, fileKey) => {
  const key = pageKey !== null ? `${targetKey}/${storyKey}/${pageKey}/${fileKey}` : `${targetKey}/${storyKey}/${fileKey}`;
  const params = {
    Bucket: targetBucket,
    Key: key,
    Body: data
  };
  await s3.putObject(params, (err, data) => {
    if (err) console.debug(err, err.stack);
    else console.debug("Written file:", fileKey);
  }).promise();
};

const getGeoJSON = async (key) => {
  const params = {
    Bucket: targetBucket,
    Key: key
  };
  const result = await s3.getObject(params, (err, data) => {
    if (err) console.debug(err, err.stack);
    else return data;
  }).promise();
  return JSON.parse(result.Body.toString('utf-8'));
};

const putGeoJSON = async (key, obj) => {
  const params = {
    Bucket: targetBucket,
    Key: key,
    Body: JSON.stringify(obj, null, 2)
  };
  await s3.putObject(params, (err, data) => {
    if (err) console.debug(err, err.stack);
    else console.debug("Written file:", key);
  }).promise();
};

const copyDir = async (storyId) => {
  const objects = await s3.listObjects({
    Bucket: sourceBucket,
    Prefix: `public/story-${storyId}` // key at source!
  }).promise();
  for (const object of objects.Contents) {
    const filename = object.Key.split("/").slice(-1)[0];
    await s3.copyObject({
      Bucket: targetBucket,
      CopySource: `${sourceBucket}/${object.Key}`,
      Key: `${targetKey}/story-${storyId}/${filename}`
    }, (err, data) => {
      if (err) console.debug(err, err.stack);
      else console.debug("Copied file:", filename);
    }).promise();
  }
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    const params = JSON.parse(event.body);
    console.log("Source bucket:", sourceBucket);
    const response = {
        statusCode: 200,
    };

    try {
      // Retrieve data from database
      const story = await getStory(params.story);
      if (story !== null) {
        const pages = await getPages(params.story);
        const storyKey = `story-${params.story}`;

        // Copy contents of directory (images and data)
        await copyDir(params.story);

        // Convert story and pages to terriamap format (initfile.json)
        const initFile = storyToInitfile(story, pages);
        await writeToBucket(JSON.stringify(initFile, null, 2), storyKey, null, 'initfile.json');

        // Write pages to html
        for (const page of pages) {
          let htmlFile = pageToHTML(page);
          htmlFile = replaceBucketUrls(htmlFile, sourceBucket, targetBucket, targetKey);
          const pageKey = `page-${page.id}`;
          await writeToBucket(htmlFile, storyKey, pageKey, 'index.html');
        }

        // Insert hotspot into geojson
        const hotspotLocation = story.hotspotlocation;
        for (const sector of story.sectors) {
          const fileKey = `${sector.toLowerCase()}_hotspots.geojson`;
          const hotspots = await getGeoJSON(fileKey);
          // Insert new or update existing hotspot
          updateHotspots(hotspots, hotspotLocation, sector, story);
          await putGeoJSON(fileKey, hotspots);
        }
      }
      else {
        response.statusCode = 500;
        response.body = 'Could not retrieve story';
      }
    } catch (err) {
      console.log("Error", err);
      response.statusCode = 500;
      response.body = 'Error occured while building the story: ' + JSON.stringify(err);
    }

    if (response.statusCode === 200) {
      return JSON.stringify(response, null, 2);
    } else {
      throw Error(JSON.stringify(response, null, 2));
    }

};
