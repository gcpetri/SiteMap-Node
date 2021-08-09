const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('../utils/logger');
const viewerService = require('../services/viewer');
const geoService = require('../services/geo');
const scraperController = require('./scraper');

const exists = promisify(fs.exists);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

const LOG_FILE_PATH = path.join(__dirname, '..', '..', 'logs');

exports.verifyUpload = async (req, res) => {
  const response = {
    error: null,
    filePath: null,
  };
  const { file } = req;
  let hasFile = false;
  try {
    if (!file || !file.path) {
      throw new Error('no file provided');
    } else if (!(await exists(file.path))) {
      throw new Error('file upload failed');
    }
    hasFile = true;
    response.filePath = file.path;
    res.status(200).json(response);
  } catch (err) {
    response.error = err.message;
    logger.info(`got error ${err}`);
    if (hasFile) await viewerService.removeFile(req.file.path);
    res.status(400).json(response);
  }
};

exports.geoMain = async (req, res) => {
  const response = {
    kmlFileName: null,
    error: null,
  };
  const { filePath } = req.body;
  const { format } = req.body;
  const { onlyFirstMatch } = req.body;
  logger.info(JSON.stringify(req.body));
  let hasFile = false;
  try {
    await scraperController.auditLogs();
    if (await exists(filePath)) hasFile = true;
    response.kmlFileName = await geoService.makeKml(filePath, format, onlyFirstMatch);
    await unlink(filePath);
    res.status(200).json(response);
  } catch (err) {
    response.error = err.message;
    logger.info(err);
    if (hasFile) await unlink(filePath);
    res.status(500).json(response);
  }
};

exports.getKML = async (req, res) => {
  const { fileName } = req.params;
  if (!fileName) {
    res.writeHead(400).end();
  }
  try {
    // logger.info(fileName);
    const fileLogs = await readdir(LOG_FILE_PATH);
    let filePath = null;
    await Promise.all(fileLogs.map(async (file) => {
      // logger.info(file);
      if (file === `${fileName}.kml`) {
        filePath = path.join(LOG_FILE_PATH, file);
      }
    }));
    // logger.info(filePath);
    res.status(200);
    res.download(filePath);
  } catch (err) {
    logger.info(err);
    res.writeHead(500).end();
  }
};
