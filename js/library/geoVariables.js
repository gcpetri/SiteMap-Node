const geoVariables = {
  kmlHeader: '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">\n<Document>\n',
  kmlFooter: '\n</Document>\n</kml>',
  pointStyle: '\n<Style id="Point-Style"><IconStyle><scale>0.8</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/ylw-blank.png</href></Icon></IconStyle></Style>',
  pointStyleUrl: '<styleUrl>#Point-Style</styleUrl>\n',
  gpsRegex: '[N,W]?\\s*?-?\\d+\\.\\d{4,}o?\\s*,\\s*[N,W]?\\s*-?\\d+\\.\\d{4,}|^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?),\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$',
};

module.exports = {
  geoVariables,
};
