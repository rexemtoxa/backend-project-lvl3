import nock from 'nock';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import debug from 'debug';
import pageLoader from '../src';

const logger = debug('nock');

const genNameTempDir = () => path.join(os.tmpdir(), 'page-loader-');
const getPathToFixture = (pathToFile) => path.join(__dirname, '__fixtures__', ...pathToFile);
let tempDir;

describe('get http request to page and save html', () => {
  // Arrange
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(genNameTempDir());
  });

  beforeAll(async () => {
    nock.disableNetConnect();
    nock('http://test.positive.com')
      .get('/')
      .replyWithFile(200, getPathToFixture(['pageWithOutLocalResources.html']))
      .get('/unknown/page')
      .reply(404)
      .log(logger);
  });
  test('save page if response returns status code 200', async () => {
    // Act
    await pageLoader('http://test.positive.com', tempDir);
    // Assert
    const savedPage = await fs.readFile(path.join(tempDir, 'test-positive-com.html'), 'utf-8');
    expect(savedPage).toMatchSnapshot();
  });

  test('page should not be saved, if request fails', async () => {
    // Act
    await expect(pageLoader('http://test.positive.com/unknown/page', tempDir)).rejects.toThrow('Request failed with status code 404');
    // Assert
    await expect(fs.access(path.join(tempDir, 'test-positive-com-unknown-page.html'))).rejects
      .toThrow(/ENOENT: no such file or directory, access '\/tmp\/page-loader-.*\/test-positive-com-unknown-page.html'$/);
  });
});

describe('load page with local resources and change the src', () => {
  // Arrange
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(genNameTempDir());
  });

  beforeAll(async () => {
    nock.disableNetConnect();
    nock('http://check.amount.local.files.com')
      .get('/with/local/files')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'pageWithLocalResources.html']))
      .get('/assets/logo.jpg')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'assets', 'logo.jpg']))
      .get('/assets/index.js')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'assets', 'index.js']))
      .get('/assets/style.css')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'assets', 'style.css']))
      .get('/assets/error')
      .replyWithError({ message: 'went smth wrong', status: 500 })
      .log(logger);
  });
  const getOutputPath = (fileName) => path.join(
    tempDir, 'check-amount-local-files-com-with-local-files_files',
    fileName,
  );
  test('check loading page with local files', async () => {
    // Act
    await pageLoader('http://check.amount.local.files.com/with/local/files', tempDir);
    const expectImage = await fs.readFile(getPathToFixture(['pageWithLocalResources', 'assets', 'logo.jpg']));
    const actualScript = await fs.readFile(getOutputPath('index.js'), 'utf-8');
    const actualStyle = await fs.readFile(getOutputPath('style.css'), 'utf-8');
    const actualImage = await fs.readFile(getOutputPath('logo.jpg'));
    // Assert
    expect(actualScript).toMatchSnapshot();
    expect(actualStyle).toMatchSnapshot();
    expect(actualImage).toEqual(expectImage);
  });
});

describe('error scenarios', () => {
  test('not have a permission te create a dir', async () => {
    nock('http://test.positive.com')
      .get('/').reply(200);
    await expect(pageLoader('http://test.positive.com/', '/path_new_dir')).rejects.toThrow("EACCES: permission denied, mkdir '/path_new_dir'");
  });
});
