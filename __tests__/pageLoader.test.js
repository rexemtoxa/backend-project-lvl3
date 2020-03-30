import nock from 'nock';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import getFolderSizeCB from 'get-folder-size';
import util from 'util';
import pageLoader from '../src';

const getFolderSize = util.promisify(getFolderSizeCB);
const genNameTempDir = () => path.join(os.tmpdir(), 'page-loader-');
const getPathToFixture = (pathToFile) => path.join(__dirname, '__fixtures__', pathToFile);
let tempDir;

describe('get http request to page and save html', () => {
  // Arrange
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(genNameTempDir());
  });

  beforeAll(async () => {
    const html = await fs.readFile(getPathToFixture('pageWithOutLocalResources.html'), 'utf-8');
    nock.disableNetConnect();
    nock('http://test.positive.com')
      .get('/').reply(200, html)
      .get('/unknown/page')
      .reply(404)
      .get('/nocontent/page')
      .reply(204);
  });
  test('save page if response returns status code 200', async () => {
    // Act
    await pageLoader('http://test.positive.com', tempDir);
    // Assert
    const savedPage = await fs.readFile(path.join(tempDir, 'test-positive-com.html'), 'utf-8');
    expect(savedPage).toMatchSnapshot();
  });

  test('page should not be saved, if request fails', async () => {
    await expect(pageLoader('http://test.positive.com/unknown/page', tempDir)).rejects.toThrow('Request failed with status code 404');
    await expect(fs.access(path.join(tempDir, 'test-positive-com-unknown-page.html'))).rejects
      .toThrow(/ENOENT: no such file or directory, access '\/tmp\/page-loader-.*\/test-positive-com-unknown-page.html'$/);
  });

  test('page should not be saved, if there are no a content', async () => {
    await expect(pageLoader('http://test.positive.com/nocontent/page', tempDir)).rejects.toThrow('Page was not save, status code is 204');
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
    const htmlWithoutLocalResources = await fs.readFile(getPathToFixture('pageWithOutLocalResources.html'), 'utf-8');
    const htmlWithLocalResources = await fs.readFile(getPathToFixture('pageWithLocalResources/pageWithLocalResources.html'), 'utf-8');

    nock.disableNetConnect();
    nock('http://check.amount.local.files.com')
      .get('/without/local/files').reply(200, htmlWithoutLocalResources)
      .get('/with/local/files')
      .reply(200, htmlWithLocalResources);
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
    await expect(fs.readdir(`${tempDir}/page-with-local-resources-com_files`)).resolves.toHaveLength(4);
  });
});

describe('load page with local resources and change the src', () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(genNameTempDir());
  });

  beforeAll(async () => {
    const htmlWithLocalResources = await fs.readFile(getPathToFixture('pageWithLocalResources/pageWithLocalResources.html'), 'utf-8');

    nock.disableNetConnect();
    nock('http://check.amount.local.files.com')
      .get('/with/local/files')
      .reply(200, htmlWithLocalResources);
  });
  test('size of page with assets should equal the size after loading', async () => {
    // Arrange
    const expectedFolderSize = await getFolderSize(getPathToFixture('pageWithLocalResources'));
    // Act
    await pageLoader('http://check.amount.local.files.com/with/local/files', tempDir);
    const actualFolderSize = await getFolderSize(tempDir);
    expect(actualFolderSize).toEqual(expectedFolderSize);
  });
});
