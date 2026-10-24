import multer from 'multer';
import createHttpError from 'http-errors';

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    return callback(null, true);
  }

  callback(createHttpError(400, 'Only images allowed'));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter,
});

export default upload;