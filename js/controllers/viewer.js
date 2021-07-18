const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const viewerService = require('../services/viewer');
const logger = require('../utils/logger');

const exists = promisify(fs.exists);

exports.loadFile = async (req, res) => {
  const response = {
    fileData: null,
    error: null,
  };
  let hasFile = false;
  try {
    const { file } = req;
    if (!file) {
      throw new Error('no field file');
    } else if (!(await exists(file.path))) {
      throw new Error('file upload failed');
    }
    hasFile = true;
    const filePath = file.path;
    if (path.extname(path.basename(filePath)) === '.pdf') {
      response.fileData = await viewerService.getPdfText(filePath);
    } else if (path.extname(path.basename(filePath)) === '.docx') {
      response.fileData = await viewerService.getDocxText(filePath);
    } else {
      throw new Error('invalid file provided');
    }
    await viewerService.removeFile(filePath);
    res.status(200).json(response);
  } catch (err) {
    logger.info('got error');
    response.fileData = '';
    if (hasFile) await viewerService.removeFile(req.file.path);
    res.status(400).json(response);
  }
};
