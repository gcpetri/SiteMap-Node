// === imports ===
const express = require('express');
const path = require('path');
const logger = require('./js/utils/logger');
const mutlerUtil = require('./js/utils/multer');

const viewerController = require('./js/controllers/viewer');
const scraperController = require('./js/controllers/scraper');

// === globals ===
const PORT = process.env.PORT || 8080;

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
const previewFileUpload = mutlerUtil.viewerOptions;
const scraperFileUpload = mutlerUtil.scraperOptions;
app.post('/api/viewer', previewFileUpload.single('file'), viewerController.loadFile);
app.post('/api/scraper/upload', scraperFileUpload.single('file'), scraperController.verifyFileUpload);
app.post('/api/scraper/start', scraperController.scraperMain);
app.get('/api/scraper/status/:threadId', scraperController.getStatus);
app.get('/api/scraper/csv/:threadId', scraperController.getCSV);
app.get('/api/scraper/txt/:threadId', scraperController.getTXT);

// === route middlewares ===
app.use('/home', indexRouter.homepage);

// === page not found ===
app.use('/', (req, res) => {
  res.status(401).send('page not found');
});

// === start server ===
const listener = app.listen(PORT, (err) => {
  if (err) {
    logger.info(`Error starting the server: ${err}`);
    return;
  }
  logger.info(`Listening on port ${listener.address().port}`);
});
