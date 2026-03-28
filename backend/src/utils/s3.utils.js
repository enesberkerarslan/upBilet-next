const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

const s3Config = {
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const s3 = new S3Client(s3Config);
const bucketName = process.env.AWS_BUCKET_NAME;

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

async function uploadToS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const contentType = getContentType(filePath);
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  };
  try {
    await s3.send(new PutObjectCommand(params));
    return `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
  } catch (err) {
    console.error('S3 yükleme hatası (raw):', err);
    console.error('S3 yükleme hatası (detail):', {
      name: err?.name,
      code: err?.Code || err?.code,
      message: err?.message,
      $metadata: err?.$metadata
    });
    throw new Error('Dosya S3\'e yüklenemedi');
  }
}

async function generateSignedUrl(key) {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  try {
    const url = await awsGetSignedUrl(s3, command, { expiresIn: 3600 }); // 1 saatlik link
    return url;
  } catch (err) {
    console.error('İmzalı URL oluşturma hatası:', err);
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
  } catch (err) {
    console.error('S3 silme hatası:', err);
    throw new Error('Dosya S3\'den silinemedi');
  }
}
async function getPublicCloudFrontUrl(key) {
  return `${process.env.AWS_CLOUD_URL}/${key}`;
}

module.exports = {
  uploadToS3,
  generateSignedUrl,
  deleteFromS3,
  getContentType,
  getPublicCloudFrontUrl,
  bucketName
}; 