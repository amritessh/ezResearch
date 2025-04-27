// backend/src/services/storage/s3Service.js
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

// Configure AWS
AWS.config.update({
  region: config.awsRegion,
  accessKeyId: config.awsAccessKey,
  secretAccessKey: config.awsSecretKey
});

const s3 = new AWS.S3();

// Upload a file to S3
const uploadFile = async (filePath, key) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: config.s3Bucket,
      Key: key,
      Body: fileContent
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

// Download a file from S3
const downloadFile = async (key, destinationPath) => {
  try {
    const params = {
      Bucket: config.s3Bucket,
      Key: key
    };

    const data = await s3.getObject(params).promise();

    // Ensure directory exists
    const dir = path.dirname(destinationPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destinationPath, data.Body);
    return destinationPath;
  } catch (error) {
    console.error('Error downloading from S3:', error);
    throw new Error('Failed to download file from S3');
  }
};

// Generate a presigned URL for temporary access
const generatePresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: config.s3Bucket,
      Key: key,
      Expires: expiresIn // 1 hour by default
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

// Delete a file from S3
const deleteFile = async key => {
  try {
    const params = {
      Bucket: config.s3Bucket,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  generatePresignedUrl,
  deleteFile
};
