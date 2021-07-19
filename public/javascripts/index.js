/* eslint-disable no-console */
window.SiteMapHome = {};
const { SiteMapHome } = window;

// add the toasts for user feedback
// eslint-disable-next-line no-unused-vars
SiteMapHome.closeToast = (context) => {
  const nearToast = $(context).closest('.toast');
  $(nearToast).remove();
};

SiteMapHome.getToast = (title, toastText) => {
  const rightNow = new Date();
  const mins = rightNow.getMinutes();
  const strMins = (mins / 9 <= 1) ? `0${mins}` : mins.toString();
  const time = `${rightNow.getHours()}:${strMins}`;
  let Title = title;
  if (title === 'Success') {
    Title = `<span style="color:green">${title}</span>`;
  } else if (title === 'Error') {
    Title = `<span style="color:red">${title}</span>`;
  } else if (title === 'Warning') {
    Title = `<span style="color:yellow">${title}</span>`;
  }
  const div = `<div class='toast' data-autohide='false' role='alert' aria-live='assertive' aria-atomic='true'>
    <div class='toast-header'>
      <div class='row'>
        <div class='col-sm-8'>
          <strong class='me-auto'>${Title}</strong>
        </div>
        <div class='col-sm-2'>
          <small class='text-muted'>${time}</small>
        </div>
        <div class='col-sm-2'>
          <button id='btn-close-toast' type='button' class='btn-close' aria-label='Close' onclick=SiteMapHome.closeToast(this)></button>
        </div>
      </div>
    </div>
    <div class='toast-body'>${toastText}</div>
  </div>`;
  return div;
};

SiteMapHome.getRegex = async () => {
  const regexList = [];
  // eslint-disable-next-line func-names
  $('#list-group-regex-input').children().each(function () {
    regexList.push($(this).text());
  });
  let oneLineRegex = '';
  regexList.forEach((re, idx) => {
    oneLineRegex += `${re}${idx < regexList.length - 1 ? '|' : ''}`;
  });
  return oneLineRegex;
};

SiteMapHome.showRegexInViewer = async (text) => {
  const regex = await SiteMapHome.getRegex();
  if (regex.length > 0) {
    $('#text-view').html('');
    const tags = $('#case-sensitive-checkbox[type=checkbox]').is(':checked') ? 'g' : 'ig';
    const re = new RegExp(regex, tags);
    // console.info(`Refreshing with regex ${re}`);
    const newText = await text.replaceAll(re, (match) => `<span style="color: white; background-color: blue; padding: 1px 3px 1px 3px; border-radius: 3px;">${match}</span>`);
    $('#text-view').html(newText);
  } else {
    $('#text-view').html(text);
  }
};

SiteMapHome.refreshViewer = async () => {
  const text = $('#text-view').text();
  await SiteMapHome.showRegexInViewer(text);
};

// ----- add button lists for input toggling -------
// eslint-disable-next-line no-unused-vars
SiteMapHome.removeInputButton = async (context) => {
  const parent = $(context).parent();
  if ($(parent).attr('id') === 'list-group-regex-input') {
    const strNum = $('#num-input-regex-input').text();
    $('#num-input-regex-input').text((parseInt(strNum, 10) - 1).toString());
    $(context).remove();
    await SiteMapHome.refreshViewer();
  } else if ($(parent).attr('id') === 'list-group-file-includes') {
    const strNum = $('#num-input-file-includes').text();
    $('#num-input-file-includes').text((parseInt(strNum, 10) - 1).toString());
    $(context).remove();
  } else if ($(parent).attr('id') === 'list-group-folder-includes') {
    const strNum = $('#num-input-folder-includes').text();
    $('#num-input-folder-includes').text((parseInt(strNum, 10) - 1).toString());
    $(context).remove();
  }
};
SiteMapHome.getInputButton = (str) => {
  const btn = `<button id='btn-input-list-${str}' type='button' class='list-group-item list-group-item-action' onclick=SiteMapHome.removeInputButton(this)>${str}</button>`;
  return btn;
};
SiteMapHome.validateInputStr = (str) => {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
};

// ----- viewer helpers -----
SiteMapHome.getFileIncludes = async () => {
  let fileList = '';
  // eslint-disable-next-line func-names
  $('#list-group-file-includes').children().each(function () {
    fileList += `${$(this).text()}|`;
  });
  return (fileList.length > 0) ? fileList.slice(0, -1) : fileList;
};

SiteMapHome.getFolderIncludes = async () => {
  let folderList = '';
  // eslint-disable-next-line func-names
  $('#list-group-folder-includes').children().each(function () {
    folderList += `${$(this).text()}|`;
  });
  return (folderList.length > 0) ? folderList.slice(0, -1) : folderList;
};

SiteMapHome.getFileTypes = async () => {
  const fileTypeList = [];
  if ($('#input-pdf-file').is(':checked')) fileTypeList.push('.pdf');
  if ($('#input-docx-file').is(':checked')) fileTypeList.push('.docx');
  if ($('#input-txt-file').is(':checked')) fileTypeList.push('.txt');
  return fileTypeList;
};

SiteMapHome.postFileView = async (formData) => {
  const res = await fetch('/api/viewer', {
    method: 'POST',
    headers: {
      contentType: false,
    },
    body: formData,
  });
  const result = await res.json();
  const text = result.fileData;
  if (text.length === 0) {
    $('.toast-container').append(SiteMapHome.getToast('Error', 'file contained no text'));
    return;
  }
  await SiteMapHome.showRegexInViewer(text);
  $('.toast-container').append(SiteMapHome.getToast('Success', 'conversion of file to text successful'));
};

SiteMapHome.getTextFromTxt = async (file) => {
  const getFileText = new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsText(file);
  });
  const text = await getFileText;
  if (!text?.length === 0) {
    $('.toast-container').append(SiteMapHome.getToast('Error', 'could not get text from file'));
    return;
  }
  await SiteMapHome.showRegexInViewer(text);
  $('.toast-container').append(SiteMapHome.getToast('Success', 'conversion of file to text successful'));
};

SiteMapHome.validateFileName = async (fileName) => {
  const fileTypes = await SiteMapHome.getFileTypes();
  let fileInclude = false;
  fileTypes.forEach((ext) => {
    if (fileName.endsWith(ext)) fileInclude = true;
  });
  if (!fileInclude) {
    $('.toast-container').append(SiteMapHome.getToast('Warning', 'This file would not be scraped due to File Type restrictions'));
  }
  const fileIncludes = await SiteMapHome.getFileIncludes(fileName);
  if (fileIncludes.length !== 0 && !fileIncludes.includes(fileName)) {
    $('.toast-container').append(SiteMapHome.getToast('Warning', 'This file would not be scraped due to File Includes restrictions'));
  }
};

// ---- scraper helpers ----
SiteMapHome.getCSV = async (threadId) => {
  try {
    window.open(`http://localhost:8080/api/scraper/csv/${threadId}`);
  } catch (err) {
    console.info(err);
    console.info('could not retrieve csv file');
  }
};

SiteMapHome.getTXT = async (threadId) => {
  try {
    window.open(`http://localhost:8080/api/scraper/txt/${threadId}`);
  } catch (err) {
    console.info(err);
    console.info('could not retrieve txt file');
  }
};

SiteMapHome.startScraperWorker = async (threadId, btn, originalColor) => {
  const worker = new Worker('/javascripts/webWorkers/scraperStatus.js');
  worker.postMessage(threadId);
  worker.onmessage = async (e) => {
    $('#num-files-scraped').text(e.data[0]);
    $('#scraper-state').text(e.data[1]);
    // console.info(`Message received from worker ${e.data}`);
    if (e.data[1] === 'done' || e.data[1] === 'error') {
      $(btn).css('background-color', originalColor);
      $(btn).attr('disabled', false);
      $('.scraper-spinner').css('visibility', 'hidden');
      worker.terminate();
      $('.toast-container').append(SiteMapHome.getToast('Success', 'file scraper completed'));
      await SiteMapHome.getCSV(threadId);
      await SiteMapHome.getTXT(threadId);
    }
  };
  worker.onerror = async (e) => {
    $('#scraper-state').text('error');
    console.info(e);
    worker.terminate();
    $(btn).css('background-color', originalColor);
    $(btn).attr('disabled', false);
    $('.scraper-spinner').css('visibility', 'hidden');
    $('.toast-container').append(SiteMapHome.getToast('Error', 'file scraper received an error'));
    await SiteMapHome.getCSV(threadId);
    await SiteMapHome.getTXT(threadId);
  };
};

SiteMapHome.postScraperUpload = async (formData) => {
  const res = await fetch('/api/scraper/upload', {
    method: 'POST',
    headers: {
      contentType: false,
    },
    body: formData,
  });
  const result = await res.json();
  const { filePath } = result;
  return filePath;
};

SiteMapHome.postStartScraper = async (filePath) => {
  const requestBody = {
    filePath,
    folderIncludes: null,
    fileIncludes: null,
    fileTypes: null,
    tags: null,
    regex: null,
  };
  requestBody.regex = await SiteMapHome.getRegex();
  requestBody.fileTypes = await SiteMapHome.getFileTypes();
  requestBody.folderIncludes = await SiteMapHome.getFolderIncludes();
  requestBody.fileIncludes = await SiteMapHome.getFileIncludes();
  requestBody.tags = $('#case-sensitive-checkbox[type=checkbox]').is(':checked') ? 'g' : 'ig';
  const res = await fetch('/api/scraper/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const response = await res.json();
  const { threadId } = response;
  const { error } = response;
  if (error) {
    throw new Error(error);
  }
  return threadId;
};

// === run initially ===
$(() => {
  $('.scraper-spinner').css('visibility', 'hidden');
  // initialize boostrap tooltips
  $('[data-toggle="tooltip"]').tooltip();
  // toasts
  $('.toast').toast({ delay: 3000 });

  // get the viewer test file
  // eslint-disable-next-line func-names
  $('#view-file').on('change', async function (e) {
    e.preventDefault();
    const file = $('#view-file')[0].files[0];
    if (!file) {
      $('.toast-container').append(SiteMapHome.getToast('Error', 'please select a file first'));
      return;
    }
    const originalColor = $(this).css('background-color');
    $(this).css('background-color', '#eee');
    const formData = new FormData();
    formData.append('file', file);
    console.log(`Requesting to view file: ${file.name}`);
    try {
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        await SiteMapHome.postFileView(formData);
      } else if (file.name.endsWith('.txt')) {
        await SiteMapHome.getTextFromTxt(file);
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
      $('.toast-container').append(SiteMapHome.getToast('Error', 'could not convert pdf to text'));
    }
    $(this).css('background-color', originalColor);
    await SiteMapHome.validateFileName(file.name);
  });

  // clear the view input
  $('#btn-viewer-file-clear').on('click', (e) => {
    e.preventDefault();
    $('#text-view').html('File text...');
    $('#view-file').val('');
  });

  // refresh the view input
  $('#btn-view-file-refresh').on('click', async (e) => {
    e.preventDefault();
    await SiteMapHome.refreshViewer();
  });

  // add a regex input
  $('#btn-add-regex-input').on('click', async (e) => {
    e.preventDefault();
    const inputStr = $('#input-regex-input').val();
    if (inputStr.length === 0) {
      $('.toast-container').append(SiteMapHome.getToast('Error', 'a string is required'));
      return;
    }
    $('#input-regex-input').val('');
    const goodInputStr = SiteMapHome.validateInputStr(inputStr);
    $('#list-group-regex-input').append(SiteMapHome.getInputButton(goodInputStr));
    const strNum = $('#num-input-regex-input').text();
    $('#num-input-regex-input').text((parseInt(strNum, 10) + 1).toString());
    await SiteMapHome.refreshViewer();
  });

  // eslint-disable-next-line func-names
  $('#input-regex-input').on('keydown', async function (e) {
    if (e.keyCode === 13) {
      const inputStr = $(this).val();
      if (inputStr.length === 0) {
        $('.toast-container').append(SiteMapHome.getToast('Error', 'a string is required'));
        return;
      }
      $(this).val('');
      const goodInputStr = SiteMapHome.validateInputStr(inputStr);
      $('#list-group-regex-input').append(SiteMapHome.getInputButton(goodInputStr));
      const strNum = $('#num-input-regex-input').text();
      $('#num-input-regex-input').text((parseInt(strNum, 10) + 1).toString());
      await SiteMapHome.refreshViewer();
    }
  });

  // add a file include input
  $('#btn-add-file-includes').on('click', (e) => {
    e.preventDefault();
    const inputStr = $('#input-file-includes').val();
    if (inputStr.length === 0) {
      $('.toast-container').append(SiteMapHome.getToast('Error', 'a string is required'));
      return;
    }
    $('#input-file-includes').val('');
    const goodInputStr = SiteMapHome.validateInputStr(inputStr);
    $('#list-group-file-includes').append(SiteMapHome.getInputButton(goodInputStr));
    const strNum = $('#num-input-file-includes').text();
    $('#num-input-file-includes').text((parseInt(strNum, 10) + 1).toString());
  });

  // eslint-disable-next-line func-names
  $('#input-file-includes').on('keydown', function (e) {
    if (e.keyCode === 13) {
      const inputStr = $(this).val();
      if (inputStr.length === 0) {
        $('.toast-container').append(SiteMapHome.getToast('Error', 'a string is required'));
        return;
      }
      $(this).val('');
      const goodInputStr = SiteMapHome.validateInputStr(inputStr);
      $('#list-group-file-includes').append(SiteMapHome.getInputButton(goodInputStr));
      const strNum = $('#num-input-file-includes').text();
      $('#num-input-file-includes').text((parseInt(strNum, 10) + 1).toString());
    }
  });

  // add a folder include input
  $('#btn-add-folder-includes').on('click', (e) => {
    e.preventDefault();
    const inputStr = $('#input-folder-includes').val();
    if (inputStr.length === 0) {
      $('.toast-container').append(SiteMapHome.getToast('Error', 'a string is required'));
      return;
    }
    $('#input-folder-includes').val('');
    const goodInputStr = SiteMapHome.validateInputStr(inputStr);
    $('#list-group-folder-includes').append(SiteMapHome.getInputButton(goodInputStr));
    const strNum = $('#num-input-folder-includes').text();
    $('#num-input-folder-includes').text((parseInt(strNum, 10) + 1).toString());
  });

  // eslint-disable-next-line func-names
  $('#input-folder-includes').on('keydown', function (e) {
    if (e.keyCode === 13) {
      const inputStr = $(this).val();
      if (inputStr.length === 0) {
        $('.toast-container').append(SiteMapHome.getToast('Error', 'a string is required'));
        return;
      }
      $(this).val('');
      const goodInputStr = SiteMapHome.validateInputStr(inputStr);
      $('#list-group-folder-includes').append(SiteMapHome.getInputButton(goodInputStr));
      const strNum = $('#num-input-folder-includes').text();
      $('#num-input-folder-includes').text((parseInt(strNum, 10) + 1).toString());
    }
  });

  // clear the scraper input
  $('#btn-scraper-file-clear').on('click', (e) => {
    e.preventDefault();
    $('#scraper-file').val('');
    $('#num-files-scraped').text('0');
    $('#scraper-state').text('inactive');
    $('#btn-scraper-file').css('background-color', '#28a745');
    $('#btn-scraper-file').attr('disabled', false);
    $('.scraper-spinner').css('visibility', 'hidden');
  });

  // eslint-disable-next-line func-names
  $('#btn-scraper-file').on('click', async function (e) {
    e.preventDefault();
    const file = $('#scraper-file')[0].files[0];
    if (!file) {
      $('.toast-container').append(SiteMapHome.getToast('Error', 'please select a file first'));
      return;
    }
    const originalColor = $(this).css('background-color');
    $(this).css('background-color', '#eee');
    $(this).attr('disabled', true);
    $('.scraper-spinner').css('visibility', 'visible');
    const formData = new FormData();
    formData.append('file', file);
    try {
      if ((await SiteMapHome.getRegex()).length === 0) {
        throw new Error('no regular expression(s) entered');
      }
      if ((await SiteMapHome.getFileTypes()).length === 0) {
        throw new Error('no file type(s) checked');
      }
      const filePath = await SiteMapHome.postScraperUpload(formData);
      if (!filePath) {
        $('.toast-container').append(SiteMapHome.getToast('Error', 'could not get provided'));
        return;
      }
      const threadId = await SiteMapHome.postStartScraper(filePath);
      await SiteMapHome.startScraperWorker(threadId, this, originalColor);
    } catch (err) {
      $(this).css('background-color', originalColor);
      $(this).attr('disabled', false);
      $('.scraper-spinner').css('visibility', 'hidden');
      console.info(`ERROR: ${err}`);
      $('.toast-container').append(SiteMapHome.getToast('Error', err.message));
    }
  });
});
