const { infoVariables } = require('../library/infoVariables');

exports.homepage = (req, res) => {
  const localVariables = { infoVariables };
  res.render('index', { localVariables });
};
