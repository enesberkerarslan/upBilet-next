const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Config = {
  region: process.env.AWS_BUCKET_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const s3 = new S3Client(s3Config);
const bucketName = process.env.AWS_BUCKET_NAME || 'upbilets3bucket';

async function uploadToS3(key, body, contentType) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  try {
    await s3.send(new PutObjectCommand(params));
    return `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Dosya S3\'e yüklenemedi');
  }
}

async function getSignedUrl(key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 saat geçerli
    return url;
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('İmzalı URL oluşturulamadı');
  }
}

async function deleteFromS3(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Dosya S3\'den silinemedi');
  }
}

function getPublicCloudFrontUrl(key) {
  return `${process.env.AWS_CLOUDFRONT_URL}/${key}`;
}

module.exports = {
  uploadToS3,
  getSignedUrl,
  deleteFromS3,
  getPublicCloudFrontUrl,
  bucketName,
  s3Config
}; 