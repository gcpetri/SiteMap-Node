/* eslint-disable no-undef */
const { assert, expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const scraperController = require('../../js/controllers/scraper');
const scraperService = require('../../js/services/scraper');
const logger = require('../../js/utils/logger');

describe.only('scraper', () => {
  it('is defined', async () => {
    assert.isDefined(scraperController.getTXT);
    assert.isDefined(scraperController.getJSON);
    assert.isDefined(scraperController.getStatus);
    assert.isDefined(scraperController.startWorker);
    assert.isDefined(scraperController.scraperMain);
    assert.isDefined(scraperController.verifyFileUpload);
    assert.isDefined(scraperController.auditLogs);
    assert.isDefined(scraperService.getRegexMatchesFromPdf);
    assert.isDefined(scraperService.getRegexMatchesFromDocx);
    assert.isDefined(scraperService.getRegexMatchesFromTxt);
  });
  const mockResponse = {
    // eslint-disable-next-line no-unused-vars
    status: (code) => mockResponse,
    json: (data) => {
      logger.info(JSON.stringify(data));
      return data;
    },
    send: () => mockResponse,
    end: () => { },
    download: () => 'downloaded',
  };
  describe('scraper controller', () => {
    // spies
    sinon.spy(mockResponse, 'status');
    sinon.spy(mockResponse, 'send');
    sinon.spy(mockResponse, 'json');
    sinon.spy(mockResponse, 'download');
    describe('getTXT', () => {
      const mockRequest = {
        params: {
          threadId: null,
        },
      };
      beforeEach(() => {
        mockRequest.params.threadId = null;
      });
      afterEach(() => {
        scraperController.WORKER_STATUS = {};
        sinon.reset(mockResponse, 'status');
        sinon.reset(mockResponse, 'json');
        sinon.reset(mockResponse, 'send');
        sinon.reset(mockResponse, 'download');
      });
      it('null threadId', async () => {
        await scraperController.getTXT(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId unknown', async () => {
        mockRequest.params.threadId = 3;
        await scraperController.getTXT(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId exists but not the filename', async () => {
        scraperController.WORKER_STATUS = { 3: [0, 1, 2] };
        mockRequest.params.threadId = 3;
        await scraperController.getTXT(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId exists but filename is null or not found', async () => {
        scraperController.WORKER_STATUS = { 3: [0, 1, 2, null] };
        mockRequest.params.threadId = 3;
        await scraperController.getTXT(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        scraperController.WORKER_STATUS = { 3: [0, 1, 2, 'blahblah.txt'] };
        mockRequest.params.threadId = 3;
        await scraperController.getTXT(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId exists and filename is found', async () => {
        scraperController.WORKER_STATUS = { 3: [0, 1, 2, path.join(__dirname, '..', 'testFiles', 'testTxt.txt')] };
        mockRequest.params.threadId = 3;
        await scraperController.getTXT(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(200)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(1);
      });
    });
    describe('getJSON', async () => {
      const mockRequest = {
        params: {
          threadId: null,
        },
      };
      beforeEach(() => {
        mockRequest.params.threadId = null;
      });
      afterEach(() => {
        scraperController.WORKER_STATUS = { };
        sinon.reset(mockResponse, 'status');
        sinon.reset(mockResponse, 'json');
        sinon.reset(mockResponse, 'send');
        sinon.reset(mockResponse, 'download');
      });
      it('null threadId', async () => {
        await scraperController.getJSON(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId unknown', async () => {
        mockRequest.params.threadId = 3;
        await scraperController.getJSON(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId exists but not the filename', async () => {
        scraperController.WORKER_STATUS = { 3: [0, 1] };
        mockRequest.params.threadId = 3;
        await scraperController.getJSON(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId exists but filename is null or not found', async () => {
        scraperController.WORKER_STATUS = { 3: [0, 1, null] };
        mockRequest.params.threadId = 3;
        await scraperController.getJSON(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        scraperController.WORKER_STATUS = { 3: [0, 1, 'blahblah.txt'] };
        mockRequest.params.threadId = 3;
        await scraperController.getJSON(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(0);
      });
      it('threadId exists and filename is found', async () => {
        scraperController.WORKER_STATUS = { 3: [0, 1, path.join(__dirname, '..', 'testFiles', 'testTxt.txt')] };
        mockRequest.params.threadId = 3;
        await scraperController.getJSON(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(200)).to.equal(true);
        expect(mockResponse.download.callCount).to.be.equal(1);
      });
    });
    describe('getStatus', () => {
      const mockRequest = {
        params: {
          threadId: null,
        },
      };
      afterEach(() => {
        scraperController.WORKER_STATUS = {};
      });
      it('thread id is null', async () => {
        mockRequest.params.threadId = null;
        await scraperController.getStatus(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
      });
      it('thread id is not null, but worker thread does not exist', async () => {
        mockRequest.params.threadId = 3;
        await scraperController.getStatus(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(200)).equal(true);
      });
      it('thread id is not null but worker thread does not exist', async () => {
        mockRequest.params.threadId = 3;
        scraperController.WORKER_STATUS = { 3: [0, 1] };
        await scraperController.getStatus(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(200)).equal(true);
        expect(mockResponse.json.calledWith(scraperController.WORKER_STATUS[3])).equal(true);
      });
    });
    describe('verifyFileUpload', () => {
      const mockRequest = {
        file: null,
      };
      const expectedResponse = {
        error: null,
        filePath: null,
      };
      beforeEach(() => {
        mockRequest.file = null;
      });
      it('no file in request', async () => {
        expectedResponse.error = 'no file provided';
        expectedResponse.filePath = null;
        await scraperController.verifyFileUpload(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('file did not upload (path does not exist)', async () => {
        mockRequest.file = { path: 'blahblah.txt' };
        expectedResponse.error = 'file upload failed';
        expectedResponse.filePath = null;
        await scraperController.verifyFileUpload(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('file path does exist', async () => {
        mockRequest.file = { path: path.join(__dirname, '..', 'testFiles', 'testTxt.txt') };
        expectedResponse.error = null;
        expectedResponse.filePath = mockRequest.file.path;
        await scraperController.verifyFileUpload(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(200)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
    });
    describe('scraperMain', () => {
      const mockRequest = {
        body: {
          regex: 'test',
          fileIncludes: [],
          folderIncludes: [],
          fileTypes: 'types',
          tags: 'ig',
          filePath: 'path',
        },
      };
      const expectedResponse = {
        error: null,
        threadId: null,
      };
      afterEach(() => {
        mockRequest.body.regex = 'test';
        mockRequest.body.fileIncludes = [];
        mockRequest.body.folderIncludes = [];
        mockRequest.body.fileTypes = 'types';
        mockRequest.body.tags = 'ig';
        mockRequest.body.filePath = 'path';
        expectedResponse.error = null;
        expectedResponse.threadId = null;
      });
      it('null regex', async () => {
        expectedResponse.error = 'regex argument empty or missing';
        mockRequest.body.regex = null;
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('empty regex', async () => {
        expectedResponse.error = 'regex argument empty or missing';
        mockRequest.body.regex = '';
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('null filePath', async () => {
        expectedResponse.error = 'filePath argument empty or missing';
        mockRequest.body.filePath = null;
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('empty filePath', async () => {
        expectedResponse.error = 'filePath argument empty or missing';
        mockRequest.body.filePath = '';
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('null fileTypes', async () => {
        expectedResponse.error = 'fileTypes argument empty or missing';
        mockRequest.body.fileTypes = null;
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('empty fileTypes', async () => {
        expectedResponse.error = 'fileTypes argument empty or missing';
        mockRequest.body.fileTypes = '';
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('null tags', async () => {
        expectedResponse.error = 'invalid regex tags';
        mockRequest.body.tags = null;
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('empty tags', async () => {
        expectedResponse.error = 'invalid regex tags';
        mockRequest.body.tags = '';
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
      it('tags not g or ig', async () => {
        expectedResponse.error = 'invalid regex tags';
        mockRequest.body.tags = 'gi';
        await scraperController.scraperMain(mockRequest, mockResponse);
        expect(mockResponse.status.calledWith(400)).equal(true);
        expect(mockResponse.json.calledWith(expectedResponse)).equal(true);
      });
    });
  });
});
