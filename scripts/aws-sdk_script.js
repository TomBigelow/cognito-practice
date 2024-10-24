import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";
import { pipeline } from "stream";
import { promisify } from "util";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

dotenv.config();

const bucketName = process.env.AWS_S3_BUCKET_NAME;

const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Create a Lambda client
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

const uploadFile = async (localFilePath, s3FilePath) => {
  const fileStream = fs.createReadStream(localFilePath);

  const uploadParams = {
    Bucket: bucketName,
    Key: s3FilePath,
    Body: fileStream,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams));
  } catch (err) {
    console.error(err);
  }
};

const downloadFile = async (s3FilePath, localFilePath) => {
  const downloadParams = {
    Bucket: bucketName,
    Key: s3FilePath,
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(downloadParams));
    const streamPipeline = promisify(pipeline);
    await streamPipeline(data.Body, fs.createWriteStream(localFilePath));
  } catch (err) {
    console.error(err);
  }
};

const readJsonFile = async (s3FilePath) => {
  const readFileParams = {
    Bucket: bucketName,
    Key: s3FilePath,
  };
  try {
    const data = await s3Client.send(new GetObjectCommand(readFileParams));
    const jsonString = await streamToString(data.Body);
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
  } catch (err) {
    console.error(err);
  }
};

const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
};

const invokeLambdaFunction = async (functionName, payload) => {
  const params = {
    FunctionName: functionName,
    Payload: Buffer.from(JSON.stringify(payload)),
  };

  try {
    const command = new InvokeCommand(params);
    const response = await lambdaClient.send(command);
    const responsePayload = JSON.parse(
      Buffer.from(response.Payload).toString()
    );
    return responsePayload;
  } catch (err) {
    console.error("Error invoking lambda function: ", err);
  }
};

// Example usage
invokeLambdaFunction("mYLambdaFunction", { length: 10, width: 20 }).then(
  (data) => console.log(data)
);

//uploadFile("./test.txt", "test.txt");
//downloadFile("test.txt", "./test.txt");
//readJsonFile("example.json").then((data) => console.log(data.message));
