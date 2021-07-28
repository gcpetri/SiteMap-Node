const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const StreamZip = require('node-stream-zip');
// const logger = require('../utils/logger');
const viewerService = require('../services/viewer');
const scraperService = require('../services/scraper');

const appendFile = promisify(fs.appendFile);

const JSON_FILE_NAME = path.join(__dirname, '..', '..', 'logs', 'SiteMap_matches_log_');
const ERROR_LOG_NAME = path.join(__dirname, '..', '..', 'logs', 'error_log_');
const TMP_STORAGE_PATH = path.join(__dirname, '..', '..', 'tmp');

const statusTypes = {
  0: 'starting',
  1: 'working',
  2: 'done',
  3: 'error',
};
let numFilesScraped = 0;

const validateFile = async (fileName, fileIncludes, fileTypes) => {
  const fileExtension = path.extname(fileName);
  if (!fileTypes.includes(fileExtension)) {
    return false;
  }
  if (fileIncludes.length === 0) {
    return true;
  }
  const re = new RegExp(fileIncludes, 'ig');
  return re.test(fileName.replace(fileExtension, '')) || path.extname(fileName) === '.kmz';
};

// eslint-disable-next-line arrow-body-style
const validateFolder = async (folderName, folderIncludes) => {
  if (folderIncludes.length === 0) {
    return true;
  }
  const re = new RegExp(folderIncludes, 'ig');
  return re.test(folderName);
};

const handleFile = async (entryName, tags, regex) => {
  if (path.extname(entryName) === '.pdf') {
    return scraperService.getRegexMatchesFromPdf(path.join(__dirname, '..', '..', 'tmp', entryName), tags, regex);
  }
  if (path.extname(entryName) === '.docx') {
    return scraperService.getRegexMatchesFromDocx(path.join(__dirname, '..', '..', 'tmp', entryName), tags, regex);
  }
  if (path.extname(entryName) === '.txt') {
    return scraperService.getRegexMatchesFromTxt(path.join(__dirname, '..', '..', 'tmp', entryName), tags, regex);
  }
  if (path.extname(entryName) === '.kmz') {
    return scraperService.getDataFromKmz(path.join(__dirname, '..', '..', 'tmp', entryName));
  }
  return null;
};

const scrapeZip = async (filePath, fileIncludes, folderIncludes, fileTypes, tags, regex) => {
  numFilesScraped = 0;
  const jsonFileName = `${JSON_FILE_NAME}${Date.now()}.json`;
  const errFileName = `${ERROR_LOG_NAME}${Date.now()}.txt`;
  await appendFile(errFileName, `${filePath},\nScraping Errors\n`);
  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file: filePath });
  const entries = await zip.entries();
  const jsonData = {};
  await Promise.all(Object.values(entries).map(async (entry) => {
    let fileName = '';
    if (path.dirname(entry.name) !== '.') {
      if (!(await validateFolder(path.dirname(entry.name), folderIncludes))) return;
      // logger.info(`directory: ${entry.name}`);
      fileName = path.basename(entry.name);
    } else {
      fileName = entry.name;
    }
    if (!(await validateFile(fileName, fileIncludes, fileTypes))) return;
    // logger.info(`file: ${fileName}`);
    numFilesScraped += 1;
    parentPort.postMessage([numFilesScraped, statusTypes[1]]);
    try {
      await zip.extract(entry.name, `${TMP_STORAGE_PATH}/${fileName}`);
      const matches = await handleFile(fileName, tags, regex);
      if (!matches || matches.length === 0) {
        throw new Error('no matches found');
      }
      // logger.info(matches);
      jsonData[entry.name] = matches;
    } catch (err) {
      await appendFile(errFileName, `${filePath},${err.message}\n`);
    }
    await viewerService.removeFile(path.join(TMP_STORAGE_PATH, fileName));
  }));
  await appendFile(jsonFileName, JSON.stringify(jsonData, null, 4));
  await zip.close();
  await viewerService.removeFile(filePath);
  parentPort.postMessage([numFilesScraped, statusTypes[2], jsonFileName, errFileName]);
};

const startScraperZip = async () => {
  await scrapeZip(
    workerData.filePath,
    workerData.fileIncludes,
    workerData.folderIncludes,
    workerData.fileTypes,
    workerData.tags,
    workerData.regex,
  );
};

(async () => {
  if (!parentPort) return;
  // logger.info('worker starting...');
  parentPort.postMessage([numFilesScraped, statusTypes[0]]);
  if (path.extname(workerData.filePath) === '.zip') await startScraperZip();
})();
