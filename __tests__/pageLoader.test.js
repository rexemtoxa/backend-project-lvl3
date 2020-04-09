import nock from 'nock';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import getFolderSizeCB from 'get-folder-size';
import util from 'util';
import debug from 'debug';
import pageLoader from '../src';

const logger = debug('nock');

const getFolderSize = util.promisify(getFolderSizeCB);
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
      .get('/nocontent/page')
      .reply(204)
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

  test('page should not be saved, if there are no a content', async () => {
    // Act
    await expect(pageLoader('http://test.positive.com/nocontent/page', tempDir)).rejects.toThrow('Page was not save, status code is 204');
    // Assert
    await expect(fs.access(path.join(tempDir, 'test-positive-com-nocontent-page.html'))).rejects
      .toThrow(/ENOENT: no such file or directory, access '\/tmp\/page-loader-.*\/test-positive-com-nocontent-page.html'$/);
  });
});

describe('amount of file should be equal amount of local resources', () => {
  // Arrange
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(genNameTempDir());
  });

  beforeAll(async () => {
    nock('http://check.amount.local.files.com')
      .get('/without/local/files')
      .replyWithFile(200, getPathToFixture(['pageWithOutLocalResources.html']))
      .get('/with/local/files')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'pageWithLocalResources.html']))
      .get('/assets/download.ico')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'assets', 'download.ico']))
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

  test('page without local resources should be save without assets folders', async () => {
    // Act
    await pageLoader('http://check.amount.local.files.com/without/local/files', tempDir);
    // Assert
    await expect(fs.readdir(tempDir)).resolves.toHaveLength(1);
  });

  test('amount of files should depends on references to local resources', async () => {
    // Act
    await pageLoader('http://check.amount.local.files.com/with/local/files', tempDir);
    // Assert
    await expect(fs.readdir(`${tempDir}/check-amount-local-files-com-with-local-files_files`)).resolves.toHaveLength(4);
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
      .get('/assets/download.ico')
      .replyWithFile(200, getPathToFixture(['pageWithLocalResources', 'assets', 'download.ico']))
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
  test('size of page with assets should equal the size after loading', async () => {
    // Arrange
    const expectedFolderSize = await getFolderSize(getPathToFixture(['pageWithLocalResources', 'assets']));
    // Act
    await pageLoader('http://check.amount.local.files.com/with/local/files', tempDir);
    const actualFolderSize = await getFolderSize(path.join(tempDir, 'check-amount-local-files-com-with-local-files_files'));
    // Assert
    expect(actualFolderSize).toEqual(expectedFolderSize);
  });
});

describe('error scenarios', () => {
  test('not have a permission te create a dir', async () => {
    nock('http://test.positive.com')
      .get('/').reply(200);
    await expect(pageLoader('http://test.positive.com/', '/path_new_dir')).rejects.toThrow("EACCES: permission denied, mkdir '/path_new_dir'");
  });
});
