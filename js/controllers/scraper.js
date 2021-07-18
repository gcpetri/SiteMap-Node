const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { Worker } = require('worker_threads');
const viewerService = require('../services/viewer');
const logger = require('../utils/logger');

const exists = promisify(fs.exists);

const WORKER_STATUS = {};

exports.getStatus = async (req, res) => {
  const { threadId } = req.params;
  logger.info(`heard get status ${threadId}`);
  if (!threadId) {
    res.status(400).json(['0', 'thread argument not specified']);
    return;
  }
  res.status(200).json(WORKER_STATUS[threadId]);
};

exports.startWorker = async (filePath, fileIncludes, folderIncludes, fileTypes, regex) => {
  const workerData = {
    filePath,
    fileIncludes,
    folderIncludes,
    fileTypes,
    regex,
  };
  const worker = new Worker(path.join(__dirname, '..', 'workers', 'scrapeWorker.js'), { workerData });
  WORKER_STATUS[worker.threadId] = [0, 'starting'];
  worker.on('message', async (data) => {
    logger.info(data);
    WORKER_STATUS[worker.threadId] = data;
    if (data[1] === 'done') {
      await worker.terminate();
      await viewerService.removeFile(filePath);
    } else if (data[1] === 'error') {
      WORKER_STATUS[worker.threadId] = [0, 'error'];
      await worker.terminate();
      await viewerService.removeFile(filePath);
    }
  });
  worker.on('error', async (err) => {
    WORKER_STATUS[worker.threadId] = [0, 'error'];
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
    logger.info(JSON.stringify(req.body));
    filePath = req.body.filePath;
    const { regex } = req.body;
    const { fileIncludes } = req.body;
    const { folderIncludes } = req.body;
    const { fileTypes } = req.body;
    if ((!filePath?.length ?? 0) === 0) {
      throw new Error('filePath argument missing');
    }
    if ((regex?.length ?? 0) === 0) {
      throw new Error('regex argument empty or missing');
    } if (!fileIncludes) {
      throw new Error('fileIncludes argument missing');
    } if (!folderIncludes) {
      throw new Error('folderIncludes argument missing');
    } if ((fileTypes?.length ?? 0) === 0) {
      throw new Error('regex argument empty or missing');
    }
    response.threadId = await exports.startWorker(
      filePath,
      fileIncludes,
      folderIncludes,
      fileTypes,
      regex,
    );
    res.status(200).json(response);
  } catch (err) {
    response.error = err.message;
    logger.info(`got error ${err}`);
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
    logger.info(`got error ${err}`);
    if (hasFile) await viewerService.removeFile(req.file.path);
    res.status(400).json(response);
  }
};
