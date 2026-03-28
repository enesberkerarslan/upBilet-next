const mediaService = require('../../services/admin/media.service');

class MediaController {
  async getAllMedia(req, res) {
    try {
      const media = await mediaService.getAllMedia();
      res.status(200).json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error('GetAllMedia Error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'Dosya yüklenmedi' 
        });
      }

      const media = await mediaService.uploadFile(req.file);
      res.status(201).json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error('UploadMedia Error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async getMedia(req, res) {
    try {
      const { id } = req.params;
      const media = await mediaService.getMediaById(id);
      res.status(200).json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error('GetMedia Error:', error);
      res.status(404).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async deleteMedia(req, res) {
    try {
      const { id } = req.params;
      const result = await mediaService.deleteMedia(id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('DeleteMedia Error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new MediaController(); 