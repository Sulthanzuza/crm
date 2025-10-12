
const path = require('path');
const fs = require('fs');
const multer = require('multer');


function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const BASE_DIR = path.join(process.cwd(), 'uploads');

const allowedMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
]);

function makeUploader(subdir = '') {
  const destDir = path.join(BASE_DIR, subdir);
  ensureDir(destDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => cb(null, file.originalname),
  });

  const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
      if (allowedMimes.has(file.mimetype)) return cb(null, true);
      return cb(new Error('Unsupported file type'));
    },
  });

  function toPublicUrl(savedPath) {
  
    const rel = path.relative(BASE_DIR, savedPath).replace(/\\/g, '/');
    return `/uploads/${rel}`;
  }

  return { upload, toPublicUrl };
}

module.exports = { makeUploader };
