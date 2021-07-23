/* eslint-disable no-undef */
const { assert, expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const viewerController = require('../../js/controllers/viewer');
const viewerService = require('../../js/services/viewer');
const logger = require('../../js/utils/logger');

describe('viewer', () => {
  it('is defined', async () => {
    assert.isDefined(viewerController.loadFile);
    assert.isDefined(viewerService.backupDocxToText);
    assert.isDefined(viewerService.backupPdfToText);
    assert.isDefined(viewerService.docxToText);
    assert.isDefined(viewerService.flatenMatches);
    assert.isDefined(viewerService.getDocxText);
    assert.isDefined(viewerService.getPdfText);
    assert.isDefined(viewerService.regexFromText);
    assert.isDefined(viewerService.removeFile);
    assert.isDefined(viewerService.pdfToText);
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

  describe('viewer controller (controllers/viewer.js)', () => {
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
  describe('viewer service (services/viewer.js)', () => {
    describe('pdfToText', () => {
      it('pdfToText returns non-empty text', async () => {
        const text = await viewerService.pdfToText(path.join(__dirname, '..', 'testFiles', 'logs.pdf'));
        expect(text.length).to.not.be.equal(0);
      });
      it('pdfToText returns empty text', async () => {
        const text = await viewerService.pdfToText(path.join(__dirname, '..', 'testFiles', 'blankDoc.pdf'));
        expect(text.trim().length).to.be.equal(0);
      });
    });
    describe('backupPdfToText', () => {
      it('pdfToText returns non-empty text', async () => {
        const text = await viewerService.backupPdfToText(path.join(__dirname, '..', 'testFiles', 'logs.pdf'));
        expect(text.length).to.not.be.equal(0);
      });
      it('pdfToText returns empty text', async () => {
        const text = await viewerService.backupPdfToText(path.join(__dirname, '..', 'testFiles', 'blankDoc.pdf'));
        expect(text.trim().length).to.be.equal(0);
      });
    });
    describe('docxToText', () => {
      it('docxToText returns non-empty text', async () => {
        const text = await viewerService.docxToText(path.join(__dirname, '..', 'testFiles', 'CitationPractice.docx'));
        expect(text.length).to.not.be.equal(0);
      });
      it('docxToText returns empty text', async () => {
        const text = await viewerService.docxToText(path.join(__dirname, '..', 'testFiles', 'blankDoc.docx'));
        expect(text.trim().length).to.be.equal(0);
      });
    });
    describe('backupDocxToText', () => {
      it('docxToText returns non-empty text', async () => {
        const text = await viewerService.backupDocxToText(path.join(__dirname, '..', 'testFiles', 'CitationPractice.docx'));
        expect(text.length).to.not.be.equal(0);
      });
      it('backupDocxToText returns empty text', async () => {
        const text = await viewerService.backupDocxToText(path.join(__dirname, '..', 'testFiles', 'blankDoc.docx'));
        expect(text.trim().length).to.be.equal(0);
      });
    });
    describe('getPdfText', () => {
      afterEach(() => {
        viewerService.pdfToText.restore();
        viewerService.backupPdfToText.restore();
      });
      it('get text from pdfToText', async () => {
        sinon.stub(viewerService, 'pdfToText').callsFake(() => 'some text');
        sinon.stub(viewerService, 'backupPdfToText').callsFake(() => 'some backup text');
        const text = await viewerService.getPdfText(path.join(__dirname, '..', 'testFiles', 'logs.pdf'));
        expect(text).to.be.equal('some text');
      });
      it('get text from backupPdfToText', async () => {
        sinon.stub(viewerService, 'pdfToText').callsFake(() => ' ');
        sinon.stub(viewerService, 'backupPdfToText').callsFake(() => 'some backup text');
        const text = await viewerService.getPdfText(path.join(__dirname, '..', 'testFiles', 'logs.pdf'));
        expect(text).to.be.equal('some backup text');
      });
      it('throw error for no text found', async () => {
        sinon.stub(viewerService, 'pdfToText').callsFake(() => ' ');
        sinon.stub(viewerService, 'backupPdfToText').callsFake(() => '');
        try {
          await viewerService.getPdfText(path.join(__dirname, '..', 'testFiles', 'blankDoc.pdf'));
        } catch (err) {
          expect(err.message).to.be.equal('could not convert pdf to text');
        }
      });
    });
    describe('getDocxText', () => {
      afterEach(() => {
        viewerService.docxToText.restore();
        viewerService.backupDocxToText.restore();
      });
      it('get text from docxToText', async () => {
        sinon.stub(viewerService, 'docxToText').callsFake(() => 'some text');
        sinon.stub(viewerService, 'backupDocxToText').callsFake(() => 'some backup text');
        const text = await viewerService.getDocxText(path.join(__dirname, '..', 'testFiles', 'CitationPractice.docx'));
        expect(text).to.be.equal('some text');
      });
      it('get text from backupDocxToText', async () => {
        sinon.stub(viewerService, 'docxToText').callsFake(() => ' ');
        sinon.stub(viewerService, 'backupDocxToText').callsFake(() => 'some backup text');
        const text = await viewerService.getDocxText(path.join(__dirname, '..', 'testFiles', 'CitationPractice.docx'));
        expect(text).to.be.equal('some backup text');
      });
      it('throw error for no text found', async () => {
        sinon.stub(viewerService, 'docxToText').callsFake(() => ' ');
        sinon.stub(viewerService, 'backupDocxToText').callsFake(() => '');
        try {
          await viewerService.getDocxText(path.join(__dirname, '..', 'testFiles', 'blankDoc.docx'));
        } catch (err) {
          expect(err.message).to.be.equal('could not convert docx to text');
        }
      });
    });
    describe('flatenMatches', () => {
      it('get flat array from 2d array', async () => {
        const flatArray = await viewerService.flatenMatches([['hi', 'bye'], 'sup', ['boi']]);
        expect(Array.isArray(flatArray)).to.be.equal(true);
        expect(flatArray.toString()).to.be.equal(['hi', 'bye', 'sup', 'boi'].toString());
      });
      it('get flat array of flat array', async () => {
        const flatArray = await viewerService.flatenMatches(['hi', 'bye']);
        expect(Array.isArray(flatArray)).to.be.equal(true);
        expect(flatArray.toString()).to.be.equal(['hi', 'bye'].toString());
      });
      it('get empty array from empty array', async () => {
        const flatArray = await viewerService.flatenMatches([]);
        expect(Array.isArray(flatArray)).to.be.equal(true);
        expect(flatArray.length).to.be.equal(0);
      });
    });
    describe('regexFromText', () => {
      it('random regex pattern tests', async () => {
        let matches = await viewerService.regexFromText('a', 'g', 'greg');
        expect(matches.length).to.be.equal(0);
        expect(Array.isArray(matches)).to.be.equal(true);
        matches = await viewerService.regexFromText('g|e|re|reg', 'ig', 'Greg');
        logger.info(matches);
        expect(matches.length).to.be.equal(3);
        expect(matches.toString()).to.be.equal(['G', 're', 'g'].toString());
        matches = await viewerService.regexFromText('a|a\\s', 'g', 'a ');
        logger.info(matches);
        expect(matches.length).to.be.equal(1);
        expect(matches.toString()).to.be.equal(['a'].toString());
        matches = await viewerService.regexFromText('a|ah', 'g', 'ah');
        logger.info(matches);
        expect(matches.length).to.be.equal(1);
        expect(matches.toString()).to.be.equal(['a'].toString());
        matches = await viewerService.regexFromText('ah|a', 'g', 'ah');
        logger.info(matches);
        expect(matches.length).to.be.equal(1);
        expect(matches.toString()).to.be.equal(['ah'].toString());
        matches = await viewerService.regexFromText('ah|a|ahg', 'g', 'ahg ahg');
        logger.info(matches);
        expect(matches.length).to.be.equal(2);
        expect(matches.toString()).to.be.equal(['ah', 'ah'].toString());
      });
    });
    describe('removeFile', () => {
      it('remove invalidFile', async () => {
        expect(async () => viewerService.removeFile('blahblah.txt')).to.not.throw();
      });
    });
  });
});
