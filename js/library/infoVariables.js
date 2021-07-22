const infoVariables = {
  commonRegex: [
    {
      name: 'GPS Coordinates',
      expressions: [{
        reg: 'N?\\s?\\d+\\.\\d{4,}o?,\\s?W?\\s?-?\\d+\\.\\d{4,}\\s?|N?\\s?\\d+\\.\\d{4,}o?,\\s?W?\\s?-?\\d+\\.\\d{4,}\\s?',
        matches: ['N 29.45017o, W -98.69689', '29.45017, -98.69689'],
      }, {
        reg: '^[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?),\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$',
        matches: ['+90.0, -127.554334', '45, 180', '-90.000, -180.0000', '47.1231231, 179.99999999', '+90, +180'],
      }],
    }, {
      name: 'Phone Number',
      expressions: [{
        reg: '\\(?\\d{3}[\\),-]?\\s?\\d{3}-?\\d{4}',
        matches: ['(888) 888-8888', '888-888-8888', '88888888888'],
      }],
    }, {
      name: 'Time',
      expressions: [{
        reg: '[0-9]+:[0-9]{2}',
        matches: ['17:50', '1:20'],
      }, {
        reg: '\\d?\\d/\\d?\\d/\\d{4}',
        matches: ['12/25/2021'],
      }],
    }, {
      name: 'Name',
      expressions: [{
        reg: '([\\w\\-]+)\\s*,\\s*(\\w+)',
        matches: ['Smith, Paul', 'Petri,Gregory'],
      }],
    },
  ],
};

module.exports = {
  infoVariables,
};
