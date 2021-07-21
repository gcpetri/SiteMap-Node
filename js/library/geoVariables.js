const geoVariables = {
  kmlHeader: '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">',
  kmlFooter: '\n</kml>',
  gpsRegex: '/N?\\s?\\d+\\.\\d{4,}o?,\\s?W?\\s?-?\\d+\\.\\d{4,}\\s?',
};

module.exports = {
  geoVariables,
};
