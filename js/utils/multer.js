const multer = require('multer');
const path = require('path');

const TMP_STORAGE_PATH = path.join(__dirname, '..', '..', 'tmp');

const viewerOptions = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TMP_STORAGE_PATH);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1000 * 1000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|txt|docx)$/)) {
      return cb(new Error('Please upload .pdf .txt or .docx file'));
    }
    return cb(undefined, true);
  },
});

const scraperOptions = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TMP_STORAGE_PATH);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1000 * 1000 * 100,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.zip$/)) {
      return cb(new Error('Please upload a .zip file'));
    }
    return cb(undefined, true);
  },
});

const geoOptions = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TMP_STORAGE_PATH);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1000 * 1000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.json$/)) {
      return cb(new Error('Please upload .csv file'));
    }
    return cb(undefined, true);
  },
});

module.exports = {
  viewerOptions,
  scraperOptions,
  geoOptions,
};
