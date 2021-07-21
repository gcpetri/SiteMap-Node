const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const viewerService = require('./viewer');
const logger = require('../utils/logger');
const { geoVariables } = require('../library/geoVariables');

const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);

const KML_FILE_PATH = path.join(__dirname, '..', '..', 'logs');

const getGpsCoord = async (name, point) => {
  const pointStr = `\t<Placemark><name>${name}</name><Point><coordinates>${point},0</coordinates></Point></Placemark>`;
  return pointStr;
};

exports.writeToKml = async (name, strMatches, kmlFile) => {
  const matches = await viewerService.regexFromText(geoVariables.gpsRegex, 'ig', strMatches);
  if (matches.length > 0) {
    await Promise.all(matches.map(async (match) => {
      const strGpsCoord = await match.replace(/[^\d^,^.]/g, '');
      logger.info(strGpsCoord);
      await appendFile(kmlFile, await getGpsCoord(name, strGpsCoord));
    }));
  }
};

exports.makeKml = async (filePath) => {
  const jsonData = await JSON.parse(await readFile(filePath));
  const kmlFile = `${KML_FILE_PATH}/Site_Map_${Date.now()}.kml`;
  await appendFile(kmlFile, geoVariables.kmlHeader);
  await Promise.all(Object.entries(jsonData, async (key, value) => {
    if ((value?.length ?? 0) === 0) return;
    await exports.writeToKml(key, value.toString(), kmlFile);
  }));
  await appendFile(kmlFile, geoVariables.kmlFooter);
  return path.basename(kmlFile.replace(path.extname(kmlFile), ''));
};
