/* eslint-disable no-console */
const DELAY_PER_STATUS_REQUEST = 5000;
let lastNumFilesScraped = 0;

const getScraperStatus = async (threadId) => {
  try {
    const res = await fetch(`/api/scraper/status/${threadId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        threadId,
      },
    });
    const result = await res.json();
    // console.info(JSON.stringify(result));
    lastNumFilesScraped = result[0]; // eslint-disable-line prefer-destructuring
    postMessage([result[0], result[1]]);
    await new Promise((resolve) => {
      setTimeout(() => resolve(), DELAY_PER_STATUS_REQUEST);
    });
    if (result[1] === 'done' || result[1] === 'error') {
      return;
    }
    await getScraperStatus(threadId);
  } catch (err) {
    console.info(err);
    postMessage([lastNumFilesScraped, 'error']);
  }
};

onmessage = async (e) => {
  await getScraperStatus(e.data);
};
