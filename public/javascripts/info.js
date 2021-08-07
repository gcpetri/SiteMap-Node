/* eslint-env jquery */
/* eslint-disable no-console */
// eslint-disable-next-line no-unused-vars, func-names
const copyToClipboard = function (context) {
  const span = $(context).parent().parent().find('span')[0];
  const $temp = $('<input>');
  $('body').append($temp);
  $temp.val($(span).text()).select();
  const success = document.execCommand('copy');
  console.info(success ? 'copied' : 'could not copy');
  $temp.remove();
};
