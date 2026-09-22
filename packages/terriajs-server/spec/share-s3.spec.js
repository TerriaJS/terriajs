import {
  CreateBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { LocalstackContainer } from "@testcontainers/localstack";
import supertestReq from "supertest";

import makeServer from "../lib/makeserver.js";
import options from "../lib/options.js";

// in this test we can't mock file system as it will break down the testcontainers setup and tests won't work
describe("Share Module (e2e) - S3", () => {
  let localstackContainer;

  function buildApp(settingsOverrides = {}) {
    const opts = options.init(true);
    const mergedOptions = Object.assign({}, opts, {
      wwwroot: "./spec/mockwwwroot",
      hostName: "localhost",
      port: "3001",
      settings: {
        shareUrlPrefixes: {
          s3: {
            service: "s3",
            region: "us-east-1",
            bucket: "sample-bucket",
            endpoint: localstackContainer.getConnectionUri(),
            accessKeyId: "test",
            secretAccessKey: "test",
            keyLength: 54,
            forcePathStyle: true
          }
        },
        newShareUrlPrefix: "s3",
        shareMaxRequestSize: "200kb",
        ...settingsOverrides
      }
    });
    return makeServer(mergedOptions);
  }

  beforeAll(async () => {
    localstackContainer = await new LocalstackContainer(
      "localstack/localstack:4.14.0"
    ).start();

    const endpoint = localstackContainer.getConnectionUri();

    const client = new S3Client({
      endpoint: endpoint,
      forcePathStyle: true,
      region: "us-east-1",
      credentials: {
        secretAccessKey: "test",
        accessKeyId: "test"
      }
    });

    const [bucket1, bucket2] = await Promise.all([
      client.send(new CreateBucketCommand({ Bucket: "sample-bucket" })),
      client.send(new CreateBucketCommand({ Bucket: "sample-bucket-2" }))
    ]);
    expect(bucket1.$metadata.httpStatusCode).toEqual(200);
    expect(bucket2.$metadata.httpStatusCode).toEqual(200);
  }, 120000);

  it("should save and resolve share via s3 provider", async () => {
    const app = buildApp();
    const response = await supertestReq(app)
      .post("/share")
      .send({ data: "test content" })
      .expect(201);

    expect(JSON.parse(response.text)).toEqual(
      jasmine.objectContaining({
        id: "s3-aqJr26G16vOvgbBGgrfzSYLIcy"
      })
    );

    await supertestReq(app)
      .get("/share/s3-aqJr26G16vOvgbBGgrfzSYLIcy")
      .expect(200, { data: "test content" });
  });

  it('returns correct url in response when "newShareUrlPrefix" is empty string', async () => {
    const app = buildApp({
      shareUrlPrefixes: {
        "": {
          service: "s3",
          region: "us-east-1",
          bucket: "sample-bucket",
          endpoint: localstackContainer.getConnectionUri(),
          accessKeyId: "test",
          secretAccessKey: "test",
          keyLength: 54,
          forcePathStyle: true
        }
      },
      newShareUrlPrefix: ""
    });

    const response = await supertestReq(app)
      .post("/share")
      .send({ data: "test content empty" })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.id).toEqual("hBp74ADLrPU6flu0qu07Kyi1FM0");

    await supertestReq(app)
      .get("/share/hBp74ADLrPU6flu0qu07Kyi1FM0")
      .expect(200, { data: "test content empty" });
  });

  it("should return 404 for non-existent share", async () => {
    await supertestReq(buildApp()).get("/share/s3-nonexistentid").expect(404);
  });

  it("should return 500 when saving to non-existent bucket", async () => {
    const app = buildApp({
      shareUrlPrefixes: {
        s3: {
          service: "s3",
          region: "us-east-1",
          bucket: "no-such-bucket",
          endpoint: localstackContainer.getConnectionUri(),
          accessKeyId: "test",
          secretAccessKey: "test",
          keyLength: 54,
          forcePathStyle: true
        }
      }
    });

    const response = await supertestReq(app)
      .post("/share")
      .send({ data: "test content" })
      .expect(500);

    expect(response.body.message).toBeDefined();
  });

  it("should return 400 for unknown share prefix", async () => {
    await supertestReq(buildApp()).get("/share/unknown-someid").expect(400);
  });

  it("should return 404 when newShareUrlPrefix is not configured", async () => {
    const app = buildApp({ newShareUrlPrefix: undefined });

    const response = await supertestReq(app)
      .post("/share")
      .send({ data: "test content" })
      .expect(404);

    expect(response.body.message).toContain(
      "not been configured to generate new share URLs"
    );
  });

  describe("multiple S3 prefixes with separate buckets", () => {
    const idToObject = (id) => id.replace(/^(.)(.)/, "$1/$2/$1$2");

    function buildMultiBucketApp() {
      const opts = options.init(true);
      return makeServer(
        Object.assign({}, opts, {
          wwwroot: "./spec/mockwwwroot",
          hostName: "localhost",
          port: "3001",
          settings: {
            shareUrlPrefixes: {
              primary: {
                service: "s3",
                region: "us-east-1",
                bucket: "sample-bucket",
                endpoint: localstackContainer.getConnectionUri(),
                accessKeyId: "test",
                secretAccessKey: "test",
                keyLength: 54,
                forcePathStyle: true
              },
              secondary: {
                service: "s3",
                region: "us-east-1",
                bucket: "sample-bucket-2",
                endpoint: localstackContainer.getConnectionUri(),
                accessKeyId: "test",
                secretAccessKey: "test",
                keyLength: 54,
                forcePathStyle: true
              }
            },
            newShareUrlPrefix: "primary",
            shareMaxRequestSize: "200kb"
          }
        })
      );
    }

    function secondaryClient() {
      return new S3Client({
        endpoint: localstackContainer.getConnectionUri(),
        forcePathStyle: true,
        region: "us-east-1",
        credentials: { accessKeyId: "test", secretAccessKey: "test" }
      });
    }

    it("resolves share stored in secondary bucket using secondary prefix", async () => {
      const shareId = "ab1SecondaryTestShareId123456789012345678901234567890";
      await secondaryClient().send(
        new PutObjectCommand({
          Bucket: "sample-bucket-2",
          Key: idToObject(shareId),
          Body: JSON.stringify({ source: "secondary bucket" })
        })
      );

      await supertestReq(buildMultiBucketApp())
        .get(`/share/secondary-${shareId}`)
        .expect(200, { source: "secondary bucket" });
    });

    it("stores new share only in primary bucket", async () => {
      const app = buildMultiBucketApp();
      const { body } = await supertestReq(app)
        .post("/share")
        .send({ data: "primary only content" })
        .expect(201);

      const baseId = body.id.replace(/^primary-/, "");

      await supertestReq(app).get(`/share/primary-${baseId}`).expect(200, {
        data: "primary only content"
      });

      await supertestReq(app).get(`/share/secondary-${baseId}`).expect(404);
    });

    it("returns 404 when resolving secondary share id using primary prefix", async () => {
      const shareId = "cd2SecondaryOnlyShareId1234567890123456789012345678901";
      await secondaryClient().send(
        new PutObjectCommand({
          Bucket: "sample-bucket-2",
          Key: idToObject(shareId),
          Body: JSON.stringify({ source: "secondary only" })
        })
      );

      await supertestReq(buildMultiBucketApp())
        .get(`/share/primary-${shareId}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    await localstackContainer.stop();
  });
});
