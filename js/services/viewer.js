const fs = require('fs');
const { promisify } = require('util');
const pdfreader = require('pdfreader');
const pdftotext = require('pdf-to-text');
const mammoth = require('mammoth');
const textract = require('textract');
const logger = require('../utils/logger');
const { RegExpMatchAll } = require('../utils/regex');

// === promisify methods ===
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// ------- pdf to text methods --------
exports.pdfToText = (filePath) => new Promise((resolve) => {
  pdftotext.pdfToText(filePath, (err, data) => {
    if (err) resolve('');
    resolve(data);
  });
});

exports.backupPdfToText = async (filePath) => {
  let masterString = '';
  await readFile(filePath);
  const awaitParser = new Promise((resolve) => {
    new pdfreader.PdfReader().parseFileItems(filePath, (err, item) => {
      if (item) {
        if (item.text) {
          masterString += item.text;
        }
      } else {
        resolve();
      }
    });
  });
  await awaitParser;
  return masterString;
};

// -------- docx to text methods -----------
exports.docxToText = async (filePath) => new Promise((resolve) => {
  mammoth.extractRawText({ path: filePath }).then((result) => {
    resolve(result.value);
  }).done();
});

exports.backupDocxToText = async (filePath) => new Promise((resolve) => {
  textract.fromFileWithPath(filePath, (err, text) => {
    resolve(text);
  });
});

// -------- viewer methods ----------
exports.getPdfText = async (filePath) => {
  let text = await exports.pdfToText(filePath);
  if (text.trim().length === 0) {
    logger.info('trying second pdf converter');
    text = await exports.backupPdfToText(filePath);
    if (text.trim().length === 0) {
      throw new Error('could not convert pdf to text');
    }
  }
  return text;
};

exports.getDocxText = async (filePath) => {
  let text = await exports.docxToText(filePath);
  if (text.trim().length === 0) {
    logger.info('trying second docx converter');
    text = await exports.backupDocxToText(filePath);
    if (text.trim().length === 0) {
      throw new Error('could not convert docx to text');
    }
  }
  return text;
};

// ------ regex methods -------
exports.regexFromText = async (regex, tags, text) => {
  if (!text || text.length === 0) return [];
  const re = new RegExpMatchAll(regex, tags);
  // logger.info(re);
  const matches = await text.matchAll(re);
  if (matches.length === 0) return [];
  return exports.flatenMatches(matches);
};

exports.flatenMatches = async (matches) => {
  const flatMatches = [];
  await Promise.all(matches.map(async (match) => {
    if (Array.isArray(match)) {
      flatMatches.push(...match);
    } else {
      flatMatches.push(match);
    }
  }));
  return flatMatches;
};

// ------- !IMPORTANT to free server disk space ---------
exports.removeFile = async (filePath) => {
  try {
    await unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.info(err);
    }
  }
};
