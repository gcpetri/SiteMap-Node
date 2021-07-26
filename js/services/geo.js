const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const viewerService = require('./viewer');
const logger = require('../utils/logger');
const { geoVariables } = require('../library/geoVariables');

const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);

const KML_FILE_PATH = path.join(__dirname, '..', '..', 'logs');

const switchGps = async (match) => {
  const coorPair = match.split(',');
  return `${coorPair[1]},${coorPair[0]}`;
};

const getGpsCoord = async (key, point) => {
  const id = Math.floor(Math.random() * 5000);
  const pointStr = `\n<Placemark id="${id}">\n\t<name>${key}</name>\n\t<Point><coordinates>${point},0</coordinates></Point>\n</Placemark>`;
  return pointStr;
};

exports.writeToKml = async (key, strValue, kmlFile, format) => {
  logger.info(strValue);
  const matches = await viewerService.regexFromText(geoVariables.gpsRegex, 'ig', strValue);
  if (matches.length > 0) {
    await Promise.all(matches.map(async (match) => {
      if (!match) return;
      let newMatch = match;
      if (format === 'latLong') {
        newMatch = await switchGps(match);
      }
      const strGpsCoord = await newMatch.replace(/[^\d^,^.^-]/g, '');
      await appendFile(kmlFile, await getGpsCoord(key, strGpsCoord));
    }));
  }
};

exports.makeKml = async (filePath, format) => {
  const jsonData = await JSON.parse(await readFile(filePath));
  logger.info(JSON.stringify(jsonData));
  const kmlFile = `${KML_FILE_PATH}/Site_Map_${Date.now()}.kml`;
  await appendFile(kmlFile, geoVariables.kmlHeader);
  await appendFile(kmlFile, `<name>${path.basename(kmlFile)}</name>`);
  await Promise.all(Object.entries(jsonData).map(async ([key, value]) => {
    if (!value || value.length === 0) return;
    await exports.writeToKml(key, value.toString(), kmlFile, format);
  }));
  await appendFile(kmlFile, geoVariables.kmlFooter);
  return path.basename(kmlFile.replace(path.extname(kmlFile), ''));
};
