const fs = require('fs');
const { promisify } = require('util');
const pdfreader = require('pdfreader');
const pdftotext = require('pdf-to-text');
const pdfparse = require('pdf-parse');
const mammoth = require('mammoth');
const textract = require('textract');
const logger = require('../utils/logger');
const { RegExpMatchAll } = require('../utils/regex');

// === promisify methods ===
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// ------- pdf to text methods --------
// npm package pdf-parser
exports.backupPdfToText = async (filePath) => {
  const renderPage = (pageData) => {
    const renderOptions = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };
    return pageData.getTextContent(renderOptions)
      .then((textContent) => {
        let lastY = '';
        let text = '';
        textContent.items.forEach((item) => {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += item.str;
          }
          lastY = item.transform[5]; // eslint-disable-line prefer-destructuring
        });
        return text;
      });
  };
  const options = {
    pagerender: renderPage,
  };
  const fileData = await readFile(filePath);
  const getText = new Promise((resolve) => {
    pdfparse(fileData, options).then((data) => resolve(data.text));
  });
  return getText;
};

// npm package pdfreader
exports.pdfToText = (filePath) => new Promise((resolve) => {
  pdftotext.pdfToText(filePath, (err, data) => {
    if (err) resolve('');
    resolve(data);
  });
});

// npm package pdf-to-text
exports.benchPdfToText = async (filePath) => {
  let masterString = '';
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
  try {
    logger.info('trying starting pdf converter');
    const text = await exports.pdfToText(filePath);
    if (text.trim().length !== 0) return text;
  } catch (err) {
    // do nothing
  }
  try {
    logger.info('trying backup pdf converter');
    const text = await exports.backupPdfToText(filePath);
    if (text.trim().length !== 0) return text;
  } catch (err) {
    // do nothing
  }
  try {
    logger.info('trying bench pdf converter');
    const text = await exports.benchPdfToText(filePath);
    if (text.trim().length !== 0) return text;
  } catch (err) {
    // do nothing
  }
  throw new Error('could not convert pdf to text');
};

exports.getDocxText = async (filePath) => {
  try {
    const text = await exports.docxToText(filePath);
    if (text.trim().length !== 0) return text;
  } catch (err) {
    // do nothing
  }
  try {
    logger.info('trying second docx converter');
    const text = await exports.backupDocxToText(filePath);
    if (text.trim().length !== 0) return text;
  } catch (err) {
    // do nothing
  }
  throw new Error('could not convert docx to text');
};

// ------ regex methods -------
exports.regexFromText = async (regex, tags, text) => {
  if (!text || text.length === 0) return [];
  const re = new RegExpMatchAll(regex, tags);
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
