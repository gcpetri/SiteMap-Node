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

const WORKER_STATUS = {};

exports.getTXT = async (req, res) => {
  const { threadId } = req.params;
  if (!threadId) {
    res.status(400).end();
  }
  try {
    const fileName = WORKER_STATUS[threadId][3];
    logger.info(fileName);
    res.status(200);
    res.download(fileName);
  } catch (err) {
    logger.info(err);
    res.status(400).end();
  }
};

exports.getCSV = async (req, res) => {
  const { threadId } = req.params;
  if (!threadId) {
    res.writeHead(400).end();
  }
  try {
    const fileName = WORKER_STATUS[threadId][2];
    logger.info(fileName);
    res.status(200);
    res.download(fileName);
  } catch (err) {
    logger.info(err);
    res.writeHead(500).end();
  }
};

exports.getStatus = async (req, res) => {
  const { threadId } = req.params;
  if (!threadId) {
    res.status(400).json(['0', 'thread argument not specified']);
    return;
  }
  res.status(200).json(WORKER_STATUS[threadId]);
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
  const worker = new Worker(path.join(__dirname, '..', 'workers', 'scrapeWorker.js'), { workerData });
  WORKER_STATUS[worker.threadId] = [0, 'starting'];
  worker.on('message', async (data) => {
    logger.info(`parent got: ${data}`);
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
    await exports.auditLogs();
    logger.info(JSON.stringify(req.body));
    filePath = req.body.filePath;
    const { regex } = req.body;
    let { fileIncludes } = req.body;
    let { folderIncludes } = req.body;
    const { fileTypes } = req.body;
    const { tags } = req.body;
    if ((!filePath?.length ?? 0) === 0) {
      throw new Error('filePath argument missing');
    }
    if ((regex?.length ?? 0) === 0) {
      throw new Error('regex argument empty or missing');
    } if ((fileTypes?.length ?? 0) === 0) {
      throw new Error('regex argument empty or missing');
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
    logger.info(`got error ${err}`);
    if (hasFile) await viewerService.removeFile(req.file.path);
    res.status(400).json(response);
  }
};

exports.auditLogs = async () => {
  const logPath = path.join(__dirname, '..', '..', 'logs');
  const files = await readdir(logPath);
  await Promise.all(files.map(async (file) => {
    if ((Date.now() - (await stat(path.join(logPath, file))).mtimeMs) > 21600000.0) { // 6 hours
      await unlink(path.join(logPath, file));
    }
  }));
};