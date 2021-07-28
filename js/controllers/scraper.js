const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { Worker } = require('worker_threads');
const viewerService = require('../services/viewer');
const logger = require('../utils/logger');

const exists = promisify(fs.exists);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// [progress(0-1), status, fileName, errorFileName]
exports.WORKER_STATUS = {};

exports.getTXT = async (req, res) => {
  const { threadId } = req.params;
  if (!threadId) {
    res.status(400).end();
    return;
  }
  try {
    const fileName = exports.WORKER_STATUS[threadId][3];
    if (!fileName || !(await exists(fileName))) throw new Error('fileName could not be found');
    res.status(200);
    res.download(fileName);
  } catch (err) {
    logger.info(err);
    res.status(400).end();
  }
};

exports.getJSON = async (req, res) => {
  const { threadId } = req.params;
  if (!threadId) {
    res.status(400).end();
    return;
  }
  try {
    const fileName = exports.WORKER_STATUS[threadId][2];
    if (!fileName || !(await exists(fileName))) throw new Error('fileName could not be found');
    res.status(200);
    res.download(fileName);
  } catch (err) {
    logger.info(err);
    res.status(400).end();
  }
};

exports.getStatus = async (req, res) => {
  const { threadId } = req.params;
  if (!threadId) {
    res.status(400).json(['0', 'thread argument not specified']);
    return;
  }
  logger.info('getting status');
  res.status(200).json(exports.WORKER_STATUS[threadId]);
};

exports.startWorker = async (filePath, fileIncludes, folderIncludes, fileTypes, tags, regex) => {
  const workerData = {
    filePath,
    fileIncludes,
    folderIncludes,
    fileTypes,
    tags,
    regex,
  };
  const worker = new Worker(path.join(__dirname, '..', 'workers', 'scraperWorker.js'), { workerData });
  exports.WORKER_STATUS[worker.threadId] = [0, 'starting'];
  worker.on('message', async (data) => {
    logger.info(`parent got: ${data}`);
    exports.WORKER_STATUS[worker.threadId] = data;
    if (data[1] === 'done') {
      await worker.terminate();
      await viewerService.removeFile(filePath);
    } else if (data[1] === 'error') {
      exports.WORKER_STATUS[worker.threadId] = [0, 'error'];
      await worker.terminate();
      await viewerService.removeFile(filePath);
    }
  });
  worker.on('error', async (err) => {
    exports.WORKER_STATUS[worker.threadId] = [0, 'error'];
    await viewerService.removeFile(filePath);
    logger.info(`Worker sent error ${err}`);
  });
  worker.on('exit', async (code) => {
    // WORKER_STATUS[worker.threadId] = [0, 'done'];
    await viewerService.removeFile(filePath);
    logger.info(`Worker stopped with exit code ${code}`);
  });
  return worker.threadId;
};

exports.scraperMain = async (req, res) => {
  const response = {
    error: null,
    threadId: null,
  };
  let filePath = null;
  try {
    await exports.auditLogs();
    logger.info(JSON.stringify(req.body));
    filePath = req.body.filePath;
    const { regex } = req.body;
    let { fileIncludes } = req.body;
    let { folderIncludes } = req.body;
    const { fileTypes } = req.body;
    const { tags } = req.body;
    if (!filePath || filePath.length === 0) {
      throw new Error('filePath argument empty or missing');
    }
    if (!regex || regex.length === 0) {
      throw new Error('regex argument empty or missing');
    } if (!fileTypes || fileTypes.length === 0) {
      throw new Error('fileTypes argument empty or missing');
    } if (tags !== 'ig' && tags !== 'g') {
      throw new Error('invalid regex tags');
    }
    if (!fileIncludes) fileIncludes = '';
    if (!folderIncludes) folderIncludes = '';
    response.threadId = await exports.startWorker(
      filePath,
      fileIncludes,
      folderIncludes,
      fileTypes,
      tags,
      regex,
    );
    res.status(200).json(response);
  } catch (err) {
    response.error = err.message;
    logger.info(`scraper controller: ${err}`);
    if (filePath) await viewerService.removeFile(filePath);
    res.status(400).json(response);
  }
};

exports.verifyFileUpload = async (req, res) => {
  const response = {
    error: null,
    filePath: null,
  };
  const { file } = req;
  let hasFile = false;
  try {
    if (!file) {
      throw new Error('no file provided');
    } else if (!(await exists(file.path))) {
      throw new Error('file upload failed');
    }
    hasFile = true;
    response.filePath = file.path;
    res.status(200).json(response);
  } catch (err) {
    response.error = err.message;
    // logger.info(`got error ${err}`);
    if (hasFile) await viewerService.removeFile(req.file.path);
    res.status(400).json(response);
  }
};

exports.auditLogs = async () => {
  const logPath = path.join(__dirname, '..', '..', 'logs');
  const files = await readdir(logPath);
  await Promise.all(files.map(async (file) => {
    if ((Date.now() - (await stat(path.join(logPath, file))).mtimeMs) > 21600.0) {
      await unlink(path.join(logPath, file));
    }
  }));
};
