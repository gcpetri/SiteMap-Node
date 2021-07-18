exports.ErrorAndCode = (_message, _code) => {
  const err = new Error(_message);
  err.code = _code;
  return err;
};
