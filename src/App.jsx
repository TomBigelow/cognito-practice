import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import queryString from "query-string";
import AWS from "aws-sdk";
import awsConfig from "./aws-config";
import { Card, Button } from "antd";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
} from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import "./App.css";

const configureAWSCredentials = (idToken) => {
  AWS.config.region = awsConfig.region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: awsConfig.identityPoolId,
    Logins: {
      [`cognito-idp.${awsConfig.region}.amazonaws.com/${awsConfig.userPoolId}`]:
        idToken,
    },
  });

  // Ensure credentials are refreshed
  AWS.config.credentials.get((err) => {
    if (err) {
      console.error("Error refreshing credentials:", err);
    }
  });
};

const isTokenExpired = (token) => {
  const { exp } = jwtDecode(token);
  return Date.now() >= exp * 1000;
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const [fileList, setFileList] = useState([]);
  const [showTextInput, setShowTextInput] = useState(false);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  const handleTextUpload = async () => {
    const text = textInputRef.current.value.trim();
    console.log(text);
    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: AWS.config.credentials,
    });
    const uploadParams = {
      Bucket: awsConfig.bucketName,
      Key: "user-input.json",
      Body: text,
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      setError(null);
      if (textInputRef.current) {
        textInputRef.current.value = "";
      }
    } catch (err) {
      setError(`An error occurred while uploading the text: ${err.message}`);
    }
  };

  const signIn = () => {
    const loginUrl = `${awsConfig.hostedUIDomain}/login?client_id=${awsConfig.userPoolWebClientId}&response_type=token&scope=openid&redirect_uri=${awsConfig.redirectUri}`;
    window.location.href = loginUrl;
  };

  const redirectToLogin = () => {
    const loginUrl = `${awsConfig.hostedUIDomain}/login?client_id=${awsConfig.userPoolWebClientId}&response_type=token&scope=openid&redirect_uri=${awsConfig.redirectUri}`;
    window.location.href = loginUrl;
  };

  const uploadFile = async (file) => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: AWS.config.credentials,
    });
    const uploadParams = {
      Bucket: awsConfig.bucketName,
      Key: file.name,
      Body: file,
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(`An error occurred while uploading the file: ${err.message}`);
    }
  };

  const listFiles = async () => {
    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: AWS.config.credentials,
    });
    const listParams = {
      Bucket: awsConfig.bucketName,
    };

    try {
      const data = await s3Client.send(new ListObjectsCommand(listParams));
      setFileList(data.Contents);
    } catch (err) {
      setError(`An error occurred while listing files: ${err.message}`);
    }
  };

  const downloadFile = async (key) => {
    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: AWS.config.credentials,
    });
    const downloadParams = {
      Bucket: awsConfig.bucketName,
      Key: key,
    };

    try {
      const data = await s3Client.send(new GetObjectCommand(downloadParams));
      const response = new Response(data.Body);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = key;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setError(null);
    } catch (err) {
      setError(`An error occurred while downloading the file: ${err.message}`);
    }
  };

  const executeLambdaFunction = () => {
    // Create a Lambda client
    const lambdaClient = new LambdaClient({
      region: awsConfig.region,
      credentials: AWS.config.credentials,
    });

    const payload = { length: 10, width: 20 };

    const lambdaParams = {
      FunctionName: "mYLambdaFunction",
      Payload: JSON.stringify(payload),
    };

    lambdaClient.send(new InvokeCommand(lambdaParams), (err, data) => {
      if (err) {
        console.error(err);
      } else {
        const decodedPayload = new TextDecoder("utf-8").decode(data.Payload);
        console.log(JSON.parse(decodedPayload));
      }
    });
  };

  useEffect(() => {
    const { id_token, access_token, error, error_description } =
      queryString.parse(window.location.hash);
    if (error) {
      console.log(error);
      setError(error_description || "An error occurred during authentication.");
    } else if (id_token && !isTokenExpired(id_token)) {
      localStorage.setItem("id_token", id_token);
      localStorage.setItem("access_token", access_token);
      configureAWSCredentials(id_token);
      setAuthenticated(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedIdToken = localStorage.getItem("id_token");
      const storedAccessToken = localStorage.getItem("access_token");
      if (
        storedIdToken &&
        storedAccessToken &&
        !isTokenExpired(storedIdToken)
      ) {
        configureAWSCredentials(storedIdToken);
        setAuthenticated(true);
      } else {
        sessionStorage.removeItem("id_token");
        sessionStorage.removeItem("access_token");
        redirectToLogin();
      }
    }
  }, []);

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {!authenticated && <button onClick={signIn}>Sign In</button>}
      {authenticated && (
        <div>
          <p>Welcome!</p>
          <input
            type="file"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileInputChange}
          ></input>
          <button onClick={triggerFileInput}>Upload a file to S3</button>
          <button onClick={() => listFiles()}>Download a file from S3</button>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {fileList.map((file) => (
              <Card
                key={file.Key}
                title={file.Key}
                extra={
                  <button onClick={() => downloadFile(file.Key)}>
                    Download
                  </button>
                }
              />
            ))}
          </div>
          <button onClick={() => setShowTextInput((prev) => !prev)}>
            Upload Text
          </button>
          {showTextInput && (
            <div>
              <input
                type="text"
                style={{ width: 300, height: 300 }}
                ref={textInputRef}
              />
              <Button onClick={handleTextUpload}>Upload</Button>
            </div>
          )}
          <button onClick={executeLambdaFunction}>
            Execute a Lambda function
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
