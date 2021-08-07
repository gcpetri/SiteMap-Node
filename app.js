// === imports ===
const express = require('express');
const path = require('path');
const logger = require('./js/utils/logger');
const multerUtil = require('./js/utils/multer');

const viewerController = require('./js/controllers/viewer');
const scraperController = require('./js/controllers/scraper');
const geoController = require('./js/controllers/geo');

// === globals ===
const PORT = 3000;

// === set the view routes ===
const indexRouter = require('./js/routes/index');

// === initialize the app ===
const app = express();

// === settings ===
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// === static middlewares ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

// === api endpoints ===
const previewFileUpload = multerUtil.viewerOptions;
const scraperFileUpload = multerUtil.scraperOptions;
const geoFileUpload = multerUtil.geoOptions;
app.post('/api/viewer', previewFileUpload.single('file'), viewerController.loadFile);
app.post('/api/scraper/upload', scraperFileUpload.single('file'), scraperController.verifyFileUpload);
app.post('/api/scraper/start', scraperController.scraperMain);
app.get('/api/scraper/status/:threadId', scraperController.getStatus);
app.get('/api/scraper/json/:threadId', scraperController.getJSON);
app.get('/api/scraper/txt/:threadId', scraperController.getTXT);
app.post('/api/geo/upload', geoFileUpload.single('file'), geoController.verifyUpload);
app.post('/api/geo/start', geoController.geoMain);
app.get('/api/geo/kml/:fileName', geoController.getKML);

// === page not found ===
app.use('/', indexRouter.homepage);

// === start server ===
const listener = app.listen(PORT, (err) => {
  if (err) {
    logger.info(`Error starting the server: ${err}`);
    return;
  }
  logger.info(`Listening on port ${listener.address().port}`);
});

scraperController.auditLogs().then(() => logger.info('audited /logs'));
scraperController.auditTmp().then(() => logger.info('audited /tmp'));
