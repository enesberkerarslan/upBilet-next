const fs = require('fs').promises;
const Media = require('../../models/media.model');
const { uploadToS3, deleteFromS3, getPublicCloudFrontUrl } = require('../../utils/s3.utils');

class MediaService {
  async uploadFile(file) {
    try {
      const fileKey = `uploads/${Date.now()}-${file.originalname}`;

      await uploadToS3(file.path, fileKey);
      const publicUrl = await getPublicCloudFrontUrl(fileKey);

      const media = new Media({
        fileName: file.originalname,
        fileKey: fileKey,
        fileType: file.mimetype,
        fileSize: file.size,
        url: publicUrl,
      });

      await media.save();

      // Geçici dosyayı sil
      await fs.unlink(file.path);

      return media;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  }

  async getAllMedia() {
    try {
      const media = await Media.find().sort({ createdAt: -1 });
      return media;
    } catch (error) {
      console.error('Medya listesi alınamadı:', error);
      throw new Error('Medya listesi alınamadı');
    }
  }

  async getMediaById(id) {
    try {
      const media = await Media.findById(id);
      if (!media) {
        throw new Error('Medya bulunamadı');
      }
      return media;
    } catch (error) {
      console.error('Medya getirme hatası:', error);
      throw error;
    }
  }

  async deleteMedia(id) {
    try {
      const media = await Media.findById(id);
      if (!media) {
        throw new Error('Medya bulunamadı');
      }

      // S3'den dosyaları sil
      await deleteFromS3(media.fileKey);
      if (media.thumbnailKey) {
        await deleteFromS3(media.thumbnailKey);
      }

      // Veritabanından sil
      await Media.findByIdAndDelete(id);

      return { message: 'Medya başarıyla silindi' };
    } catch (error) {
      console.error('Medya silme hatası:', error);
      throw error;
    }
  }
}

module.exports = new MediaService(); 