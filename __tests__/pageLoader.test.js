import nock from 'nock';
import { promises as fs } from 'fs';
import os from 'os';
import _ from 'lodash';
import path from 'path';
import pageLoader from '../src';

const tempDir = path.join(os.tmpdir(), 'pageLoader');
const getPathToFixture = (fileName) => path.join(__dirname, '__fixtures__', fileName);

beforeEach(async () => {
  await fs.unlink(tempDir).catch(_.noop);
});

beforeAll(async () => {
  const html = await fs.readFile(getPathToFixture('index.html'), 'utf-8');
  nock.disableNetConnect();
  nock('http://test.positive.com')
    .get('/').reply(200, html)
    .get('/unknown/page')
    .reply(404)
    .get('/nocontent/page')
    .reply(204);
});

describe('get http request to page and save html', () => {
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
      .toThrow("ENOENT: no such file or directory, access '/tmp/pageLoader/test-positive-com-unknown-page.html'");
  });

  test('page should not be saved, if there are no a content', async () => {
    await expect(pageLoader('http://test.positive.com/nocontent/page', tempDir)).rejects.toThrow('Page was not save, status code is 204');
    await expect(fs.access(path.join(tempDir, 'test-positive-com-unknown-page.html'))).rejects
      .toThrow("ENOENT: no such file or directory, access '/tmp/pageLoader/test-positive-com-unknown-page.html'");
  });
});
