const { S3Client } = require('@aws-sdk/client-s3');

// Initialize S3Client using IAM credentials from process.env
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'school-management-system-bucket';

module.exports = {
    s3Client,
    BUCKET_NAME
};
