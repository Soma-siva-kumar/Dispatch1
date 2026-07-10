const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const UPLOAD_FOLDER = 'DispatchIQ/Incidents';

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - file buffer from multer
 * @param {string} mimetype - file MIME type
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadImage(buffer, mimetype) {
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    throw new Error(`Invalid file type: ${mimetype}. Only JPEG, PNG, and WEBP are allowed.`);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDER,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} publicId
 */
async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[Cloudinary] deleteImage error:', err.message);
  }
}

/**
 * Upload multiple file buffers in parallel
 * @param {Array<{ buffer: Buffer, mimetype: string }>} files
 * @returns {Promise<Array<{ url: string, publicId: string }>>}
 */
async function uploadImages(files) {
  return Promise.all(files.map(f => uploadImage(f.buffer, f.mimetype)));
}

module.exports = { uploadImage, uploadImages, deleteImage };
