const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const StreamZip = require('node-stream-zip');
const logger = require('../utils/logger');
const viewerService = require('../services/viewer');
const scraperService = require('../services/scraper');

const appendFile = promisify(fs.appendFile);

const CSV_FILE_NAME = path.join(__dirname, '..', '..', 'logs', 'SiteMap_matches_log_');
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
  return fileIncludes.includes(fileName.replace(fileExtension, ''));
};

// eslint-disable-next-line arrow-body-style
const validateFolder = async (fileName, folderIncludes) => {
  return (folderIncludes.length === 0) ? true : folderIncludes.includes(fileName);
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
  return null;
};

/*
const handleDirectory = async (
  zip, fileName, folderIncludes, fileIncludes, fileTypes, tags, regex
) => {
  if (!(await validateFolder(fileName, folderIncludes))) {
    return;
  }
  // const zipDotTxtContents = zip.entryDataSync('path/inside/zip.txt').toString('utf8');
  // logger.info(`The content of path/inside/zip.txt is: ${zipDotTxtContents}`);
  // const filesInDir = await readdir()
};
*/

const scrapeZip = async (filePath, fileIncludes, folderIncludes, fileTypes, tags, regex) => {
  numFilesScraped = 0;
  const csvFileName = `${CSV_FILE_NAME}${Date.now()}.csv`;
  const errFileName = `${ERROR_LOG_NAME}${Date.now()}.txt`;
  await appendFile(csvFileName, `${filePath},\nFile Name,Matches\n`);
  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file: filePath });
  const entries = await zip.entries();
  await Promise.all(Object.values(entries).map(async (entry) => {
    if (entry.isDirectory) {
      logger.info(`directory: ${entry.name}`);
      if (!(await validateFolder(entry.name, folderIncludes))) return;
      logger.info('valid dir');
      /* await handleDirectory(
        zip,
        entry.name,
        folderIncludes,
        fileIncludes,
        fileTypes,
        tags,
        regex,
      ); */
    } else if (entry.isFile) {
      logger.info(`file: ${path.dirname(entry.name)}/${path.basename(entry.name)}`);
      if (!(await validateFile(entry.name, fileIncludes, fileTypes))) return;
      numFilesScraped += 1;
      parentPort.postMessage([numFilesScraped, statusTypes[1]]);
      try {
        await zip.extract(entry.name, `${TMP_STORAGE_PATH}/${entry.name}`);
        const matches = await handleFile(entry.name, tags, regex);
        if ((matches?.length ?? 0) === 0) {
          throw new Error('no matches found');
        }
        await appendFile(csvFileName, `${entry.name},${matches.toString()}\n`);
      } catch (err) {
        await appendFile(errFileName, `${entry.name},${err.message}\n`);
      }
    }
  }));
  await zip.close();
  await viewerService.removeFile(filePath);
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
  logger.info('worker starting...');
  parentPort.postMessage([numFilesScraped, statusTypes[0]]);
  if (path.extname(workerData.filePath) === '.zip') await startScraperZip();
  logger.info('worker ending...');
  parentPort.postMessage([numFilesScraped, statusTypes[2]]);
})();
