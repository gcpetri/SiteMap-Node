/**
 * @module workers/scraperWorker
 * @description does the hard work synchonously
 */

const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const asyncBatch = require('async-batch').default;
const StreamZip = require('node-stream-zip');
const viewerService = require('../services/viewer');
const scraperService = require('../services/scraper');
const logger = require('../utils/logger');

const appendFile = promisify(fs.appendFile);

const JSON_FILE_NAME = path.join(__dirname, '..', '..', 'logs', 'SiteMap_matches_log_');
const ERROR_LOG_NAME = path.join(__dirname, '..', '..', 'logs', 'error_log_');
const TMP_STORAGE_PATH = path.join(__dirname, '..', '..', 'tmp');

const MAX_CONCURRENT_PROMISES = 5;

const statusTypes = {
  0: 'starting',
  1: 'working',
  2: 'done',
  3: 'error',
};

let NUM_FILES_SCRAPED = 0;

const ZIP_DATA = {
  filePath: null,
  fileIncludes: null,
  folderIncludes: null,
  fileTypes: null,
  tags: null,
  regex: null,
  jsonFileName: null,
  errFileName: null,
  zip: null,
};

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

const handleEntry = async (entry) => {
  let fileName = '';
  if (path.dirname(entry.name) !== '.') {
    if (!(await validateFolder(path.dirname(entry.name), ZIP_DATA.folderIncludes))) return;
    fileName = path.basename(entry.name);
  } else {
    fileName = entry.name;
  }
  if (!(await validateFile(fileName, ZIP_DATA.fileIncludes, ZIP_DATA.fileTypes))) return;
  logger.info(fileName);
  NUM_FILES_SCRAPED += 1;
  parentPort.postMessage([NUM_FILES_SCRAPED, statusTypes[1]]);
  try {
    await ZIP_DATA.zip.extract(entry.name, path.join(TMP_STORAGE_PATH, fileName));
    const matches = await handleFile(fileName, ZIP_DATA.tags, ZIP_DATA.regex);
    if (!matches || matches.length === 0) {
      throw new Error('no matches found');
    }
    await appendFile(ZIP_DATA.jsonFileName, `"${entry.name}": ${JSON.stringify(matches, null, 4)},`);
  } catch (err) {
    await appendFile(ZIP_DATA.errFileName, `${ZIP_DATA.filePath},${err.message}\n`);
  }
  await viewerService.removeFile(path.join(TMP_STORAGE_PATH, fileName));
};

const scrapeZip = async (zipFilePath) => {
  NUM_FILES_SCRAPED = 0;
  ZIP_DATA.jsonFileName = `${JSON_FILE_NAME}${Date.now()}.json`;
  ZIP_DATA.errFileName = `${ERROR_LOG_NAME}${Date.now()}.txt`;
  await appendFile(ZIP_DATA.errFileName, `${zipFilePath},\nScraping Errors\n`);
  await appendFile(ZIP_DATA.jsonFileName, '{');

  // open the zip
  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file: zipFilePath });
  ZIP_DATA.zip = zip;

  // get the zip entries
  const entries = await zip.entries();

  // batch the loop
  await asyncBatch(Object.values(entries), handleEntry, MAX_CONCURRENT_PROMISES);
  await appendFile(ZIP_DATA.jsonFileName, '"tail": []\n}');

  // close the zip
  await zip.close();

  // remove the zip file
  await viewerService.removeFile(zipFilePath);

  // tell the scraper we're done
  parentPort.postMessage([
    NUM_FILES_SCRAPED,
    statusTypes[2],
    ZIP_DATA.jsonFileName,
    ZIP_DATA.errFileName,
  ]);
};

(async () => {
  if (!parentPort) return;
  parentPort.postMessage([NUM_FILES_SCRAPED, statusTypes[0]]);
  if (path.extname(workerData.filePath) === '.zip') {
    ZIP_DATA.filePath = workerData.filePath;
    ZIP_DATA.fileIncludes = workerData.fileIncludes;
    ZIP_DATA.folderIncludes = workerData.folderIncludes;
    ZIP_DATA.fileTypes = workerData.fileTypes;
    ZIP_DATA.regex = workerData.regex;
    ZIP_DATA.tags = workerData.tags;
    await scrapeZip(ZIP_DATA.filePath);
  }
})();
