export default {
  region: import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
  identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
  bucketName: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
  hostedUIDomain: import.meta.env.VITE_COGNITO_HOSTED_UI_DOMAIN,
  redirectUri: window.location.origin,
};
