const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const viewerService = require('./viewer');

const readFile = promisify(fs.readFile);

exports.getRegexMatchesFromPdf = async (filePath, tags, regex) => {
  let text = '';
  try {
    text = await viewerService.getPdfText(filePath);
  } catch (err) {
    throw new Error(path.basename(filePath));
  }
  return viewerService.regexFromText(regex, tags, text);
};

exports.getRegexMatchesFromDocx = async (filePath, tags, regex) => {
  let text = '';
  try {
    text = await viewerService.getDocxText(filePath);
  } catch (err) {
    throw new Error(path.basename(filePath));
  }
  return viewerService.regexFromText(regex, tags, text);
};

exports.getRegexMatchesFromTxt = async (filePath, tags, regex) => {
  let text = '';
  try {
    text = await readFile(filePath, 'utf8');
  } catch (err) {
    throw new Error(path.basename(filePath));
  }
  return viewerService.regexFromText(regex, tags, text);
};
