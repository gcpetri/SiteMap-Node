const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const parseKMZ = require('parse2-kmz');
const viewerService = require('./viewer');
const logger = require('../utils/logger');

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

exports.getDataFromKmz = async (filePath) => {
  // KMZ To JSON From File
  // logger.info('get data from kmz');
  const getJson = new Promise((resolve) => {
    parseKMZ.toJson(filePath).then((results) => resolve(results));
  });
  const jsonData = await getJson;
  const coordinates = [];
  await Promise.all(jsonData.features.map(async (entry) => {
    if (!entry || !entry.geometry) return;
    const { geometry } = entry;
    if (geometry.type === 'Point') {
      coordinates.push({ point: geometry.coordinates });
    } else if (geometry.type === 'Polygon') {
      logger.info(JSON.stringify(geometry));
      coordinates.push({
        polygon: {
          outerBoundary: geometry.coordinates[0],
          innerBoundary: geometry.coordinates[1],
          extrude: entry.properties.extrude,
        },
      });
    }
  }));
  // logger.info(JSON.stringify(jsonData));
  return coordinates;
};
