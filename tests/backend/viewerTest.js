/* eslint-disable no-undef */
const { assert, expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const viewerController = require('../../js/controllers/viewer');
const logger = require('../../js/utils/logger');

describe('viewer controller (viewerController.js)', () => {
  it('is defined', async () => {
    assert.isDefined(viewerController.loadFile);
  });

  const mockResponse = {
    // eslint-disable-next-line no-unused-vars
    status: (code) => mockResponse,
    json: (data) => {
      logger.info(JSON.stringify(data));
      return data;
    },
    send: () => mockResponse,
  };

  describe('loadFile', async () => {
    // spies
    sinon.spy(mockResponse, 'status');
    sinon.spy(mockResponse, 'send');
    sinon.spy(mockResponse, 'json');
    const removeFile = sinon.spy();
    const getPdfText = sinon.spy();
    const getDocxText = sinon.spy();

    // mock viewerService module
    const mockViewerService = {
      getPdfText: () => { getPdfText(); return 'got pdf'; },
      getDocxText: () => { getDocxText(); return 'got docx'; },
      removeFile: () => { removeFile(); return { }; },
    };
    viewerController.setViewerService(mockViewerService);

    // mock objects
    const expectedResponse = {
      fileData: null,
      error: null,
    };
    const mockFile = {
      path: null,
    };
    const mockRequest = {
      file: null,
    };

    beforeEach(() => {
    });
    afterEach(() => {
      expectedResponse.fileData = null;
      expectedResponse.error = null;
      mockFile.path = null;
      mockRequest.file = null;
      sinon.reset(mockResponse, 'status');
      sinon.reset(mockResponse, 'json');
      sinon.reset(mockResponse, 'send');
    });

    // unsucessful requests
    it('give existing file, but not pdf or docx', async () => {
      mockFile.path = path.join(__dirname, '..', 'testFiles', 'testTxt.txt');
      mockRequest.file = mockFile;
      expectedResponse.error = 'invalid file provided';
      await viewerController.loadFile(mockRequest, mockResponse);
      expect(mockResponse.status.calledWith(400)).to.equal(true);
      expect(mockResponse.json.calledWith(expectedResponse)).to.equal(true);
      expect(getPdfText.callCount).to.be.equal(0);
      expect(getDocxText.callCount).to.be.equal(0);
      expect(removeFile.callCount).to.be.equal(1);
    });
    it('give a non-existant file', async () => {
      mockFile.path = 'blahblah.txt';
      mockRequest.file = mockFile;
      expectedResponse.error = 'file upload failed';
      await viewerController.loadFile(mockRequest, mockResponse);
      expect(mockResponse.status.calledWith(400)).to.equal(true);
      expect(mockResponse.json.calledWith(expectedResponse)).to.equal(true);
      expect(getPdfText.callCount).to.be.equal(0);
      expect(getDocxText.callCount).to.be.equal(0);
      expect(removeFile.callCount).to.be.equal(0);
    });
    it('do not even provide a file', async () => {
      mockRequest.file = null;
      expectedResponse.error = 'no file provided';
      await viewerController.loadFile(mockRequest, mockResponse);
      expect(mockResponse.status.calledWith(400)).to.equal(true);
      expect(mockResponse.json.calledWith(expectedResponse)).to.equal(true);
      expect(getPdfText.callCount).to.be.equal(0);
      expect(getDocxText.callCount).to.be.equal(0);
      expect(removeFile.callCount).to.be.equal(0);
    });
    it('do not provide a file path', async () => {
      mockFile.path = null;
      mockRequest.file = mockFile;
      expectedResponse.error = 'no file provided';
      await viewerController.loadFile(mockRequest, mockResponse);
      expect(mockResponse.status.calledWith(400)).to.equal(true);
      expect(mockResponse.json.calledWith(expectedResponse)).to.equal(true);
      expect(getPdfText.callCount).to.be.equal(0);
      expect(getDocxText.callCount).to.be.equal(0);
      expect(removeFile.callCount).to.be.equal(0);
    });

    // successfull requests
    it('good docx request', async () => {
      mockFile.path = path.join(__dirname, '..', 'testFiles', 'CitationPractice.docx');
      mockRequest.file = mockFile;
      expectedResponse.fileData = 'got docx';
      await viewerController.loadFile(mockRequest, mockResponse);
      expect(mockResponse.status.calledWith(200)).to.equal(true);
      expect(mockResponse.json.calledWith(expectedResponse)).to.equal(true);
      expect(getPdfText.callCount).to.be.equal(0);
      expect(getDocxText.callCount).to.be.equal(1);
      expect(removeFile.callCount).to.be.equal(1);
    });
    it('good pdf request', async () => {
      mockFile.path = path.join(__dirname, '..', 'testFiles', 'logs.pdf');
      mockRequest.file = mockFile;
      expectedResponse.fileData = 'got pdf';
      await viewerController.loadFile(mockRequest, mockResponse);
      expect(mockResponse.status.calledWith(200)).to.equal(true);
      expect(mockResponse.json.calledWith(expectedResponse)).to.equal(true);
      expect(getPdfText.callCount).to.be.equal(1);
      expect(getDocxText.callCount).to.be.equal(0);
      expect(removeFile.callCount).to.be.equal(1);
    });
  });
});
