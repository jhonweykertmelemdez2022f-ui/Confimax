const QRCode = require('qrcode');

const qrController = {
  async generateQrCode(req, res, next) {
    try {
      const { type, id } = req.query; // e.g., type=product, id=xyz

      if (!type || !id) {
        return res.status(400).json({ message: 'Type and ID are required for QR code generation.' });
      }

      const qrData = JSON.stringify({ type, id });
      const qrCodeImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });

      res.json({ qrCodeImage });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = qrController;
