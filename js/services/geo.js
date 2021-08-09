const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const viewerService = require('./viewer');
// const logger = require('../utils/logger');
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
  return `\n\t<Placemark id="${id}">\n\t\t<name>${key.replace(/&/g, 'and')}</name>\n\t\t${geoVariables.pointStyleUrl}\n\t\t<Point><coordinates>${point},0</coordinates></Point>\n\t</Placemark>`;
};

const getKmzPoint = async (key, point) => {
  const id = Math.floor(Math.random() * 5000);
  return `\n\t<Placemark id="${id}">\n\t\t<name>${key.replace(/&/g, 'and')}</name>\n\t\t${geoVariables.pointStyleUrl}\n\t\t<Point><coordinates>${point}</coordinates></Point>\n\t</Placemark>`;
};

const getKmzPolygon = async (key, polygon) => {
  const id = Math.floor(Math.random() * 5000);
  let outerBoundary = '';
  polygon.outerBoundary.forEach((coord) => {
    outerBoundary += `\n\t\t\t\t\t${coord},50`;
  });
  let innerBoundary = '';
  polygon.innerBoundary.forEach((coord) => {
    innerBoundary += `\n\t\t\t\t\t${coord},50`;
  });
  return `\n\t<Placemark id="${id}">\n\t\t<name>${key.replace(/&/g, 'and')}</name>\n\t\t<Polygon>\n\t\t<extrude>${polygon.extrude}</extrude>\n\t\t<altitudeMode>relativeToGround</altitudeMode>
  \n\t\t<outerBoundaryIs>\n\t\t\t<LinearRing>\n\t\t\t\t<coordinates>${outerBoundary}\n\t\t\t\t</coordinates>\n\t\t\t</LinearRing>\n\t\t</outerBoundaryIs>
  \n\t\t<innerBoundaryIs>\n\t\t\t<LinearRing>\n\t\t\t\t<coordinates>${innerBoundary}\n\t\t\t\t</coordinates>\n\t\t\t</LinearRing>\n\t\t</innerBoundaryIs>
  \t\t</Polygon>\n\t</Placemark>`;
};

exports.writeKmzDataToKml = async (key, value, kmlFile) => {
  await Promise.all(value.map(async (val) => {
    if (val.point) {
      await appendFile(kmlFile, await getKmzPoint(key, val.point));
    } else if (val.polygon) {
      await appendFile(kmlFile, await getKmzPolygon(key, val.polygon));
    }
  }));
};

exports.writeToKml = async (key, value, kmlFile, format, onlyFirstMatch) => {
  if (onlyFirstMatch) {
    if (value.length === 0) return;
    const match = (await viewerService.regexFromText(geoVariables.gpsRegex, 'ig', value[0].toString()))[0];
    if (!match) return;
    if (match.length === 0) return;
    let newMatch = match;
    let strGpsCoord = null;
    if (format === 'latLong') {
      newMatch = await switchGps(match);
      strGpsCoord = await newMatch.replace(/[^\d^,^.^-]/g, '');
      if (strGpsCoord[0] !== '-') strGpsCoord = `-${strGpsCoord}`;
    } else if (format === 'longLat') {
      strGpsCoord = await newMatch.replace(/[^\d^,^.^-]/g, '');
      if (!strGpsCoord.includes(',-')) {
        const coords = strGpsCoord.split(',');
        strGpsCoord = `${coords[0]},-${coords[1]}`;
      }
    }
    if (strGpsCoord) await appendFile(kmlFile, await getGpsCoord(key, strGpsCoord));
  } else {
    await Promise.all(value.map(async (strValue) => {
      const matches = await viewerService.regexFromText(geoVariables.gpsRegex, 'ig', strValue.toString());
      if (matches.length > 0) {
        await Promise.all(matches.map(async (match) => {
          if (!match) return;
          let newMatch = match;
          let strGpsCoord = null;
          if (format === 'latLong') {
            newMatch = await switchGps(match);
            strGpsCoord = await newMatch.replace(/[^\d^,^.^-]/g, '');
            if (strGpsCoord[0] !== '-') strGpsCoord = `-${strGpsCoord}`;
          } else if (format === 'longLat') {
            strGpsCoord = await newMatch.replace(/[^\d^,^.^-]/g, '');
            if (!strGpsCoord.includes(',-')) {
              const coords = strGpsCoord.split(',');
              strGpsCoord = `${coords[0]},-${coords[1]}`;
            }
          }
          if (strGpsCoord) await appendFile(kmlFile, await getGpsCoord(key, strGpsCoord));
        }));
      }
    }));
  }
};

exports.makeKml = async (filePath, format, onlyFirstMatch) => {
  const jsonData = await JSON.parse(await readFile(filePath));
  // logger.info(JSON.stringify(jsonData));
  const kmlFile = `${KML_FILE_PATH}/Site_Map_${Date.now()}.kml`;
  await appendFile(kmlFile, geoVariables.kmlHeader);
  await appendFile(kmlFile, `\t<name>${path.basename(kmlFile)}</name>`);
  await appendFile(kmlFile, geoVariables.pointStyle);
  await Promise.all(Object.entries(jsonData).map(async ([key, value]) => {
    if (!value || value.length === 0) return;
    if (key.endsWith('.kmz')) {
      await exports.writeKmzDataToKml(key, value, kmlFile);
    } else {
      await exports.writeToKml(key, value, kmlFile, format, onlyFirstMatch);
    }
  }));
  await appendFile(kmlFile, geoVariables.kmlFooter);
  return path.basename(kmlFile.replace(path.extname(kmlFile), ''));
};
