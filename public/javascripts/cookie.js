window.CookieClass = {};
const { CookieClass } = window;

CookieClass.cookieEnum = {
  0: 'fileTypes',
  1: 'regex',
  2: 'fileIncludes',
  3: 'folderIncludes',
};

CookieClass.MAX_DAYS = 21;

CookieClass.setCookie = async (cname, cvalue, exdays) => {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  const exSpan = d.toUTCString();
  document.cookie = `${cname}=${cvalue};expires=${exSpan};path=/`;
};

CookieClass.getCookie = async (cname) => {
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  let cookieValue = '';
  ca.forEach((c) => {
    const newC = c.trim();
    if (newC.indexOf(name) === 0) {
      cookieValue = newC.substring(name.length, newC.length);
    }
  });
  return cookieValue;
};

CookieClass.getCookieList = async (cname) => {
  const cookieStr = await CookieClass.getCookie(cname);
  const ca = cookieStr.split('|');
  const cookieList = [];
  ca.forEach((c) => {
    if (c.trim().length > 0) cookieList.push(c);
  });
  return cookieList;
};

CookieClass.fetchAllCookies = async () => {
  const fileTypesList = await CookieClass.getCookieList(CookieClass.cookieEnum[0]);
  if (fileTypesList.includes('.pdf')) $('#input-pdf-file').prop('checked', true);
  if (fileTypesList.includes('.docx')) $('#input-docx-file').prop('checked', true);
  if (fileTypesList.includes('.txt')) $('#input-txt-file').prop('checked', true);
  const regexList = await CookieClass.getCookieList(CookieClass.cookieEnum[1]);
  regexList.forEach((r) => {
    $('#list-group-regex-input').append(window.SiteMapHome.getInputButton(r));
    const strNum = $('#num-input-regex-input').text();
    $('#num-input-regex-input').text((parseInt(strNum, 10) + 1).toString());
  });
  const fileIncludesList = await CookieClass.getCookieList(CookieClass.cookieEnum[2]);
  fileIncludesList.forEach((r) => {
    $('#list-group-file-includes').append(window.SiteMapHome.getInputButton(r));
    const strNum = $('#num-input-file-includes').text();
    $('#num-input-file-includes').text((parseInt(strNum, 10) + 1).toString());
  });
  const folderIncludesList = await CookieClass.getCookieList(CookieClass.cookieEnum[3]);
  folderIncludesList.forEach((r) => {
    $('#list-group-folder-includes').append(window.SiteMapHome.getInputButton(r));
    const strNum = $('#num-input-folder-includes').text();
    $('#num-input-folder-includes').text((parseInt(strNum, 10) + 1).toString());
  });
};
