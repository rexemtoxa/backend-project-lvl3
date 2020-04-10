import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import { isUndefined } from 'lodash';
import url from 'url';
import debug from 'debug';
import axiosLog from 'axios-debug-log';
import Listr from 'listr';
import { generateFileName, isLocalResource, getLocalFileName } from './utils';
import changeLocalResorces from './changeHtmlPage';

const log = {
  info: debug('page-loader:INFO'),
  error: debug('page-loader:ERROR'),
  warning: debug('page-loader:WARNING'),
};

axiosLog({
  request(logger, config) {
    logger(`Request to ${config.headers['content-type']}`);
  },
  response(logger, response) {
    logger(
      `Response with status code: ${response.status}`,
    );
  },
  error(logger, error) {
    logger('ERROR: %o', error);
  },
});

const getLinksLocalResources = (htmlPage, baseURL) => {
  const $ = cheerio.load(htmlPage);
  return $('[src], [href]').toArray()
    .map((element) => (isUndefined($(element).attr('src')) ? $(element).attr('href') : $(element).attr('src')))
    .filter((link) => (isLocalResource(link, url.parse(baseURL).hostname)))
    .map((localLink) => (new URL(localLink, new URL(baseURL).origin)).href);
};

const hasLocalResources = (resources) => resources.length > 0;

const saveResorces = (listOfLinks, pathToOutputDir) => {
  log.info('dowloading local resources');
  const requests = listOfLinks.map((link) => ({
    link,
    promise: axios({
      method: 'get',
      url: link,
      responseType: 'stream',
    }),
  }));

  const tasks = requests.map(({ link, promise }) => (
    {
      title: `dowloading from ${link}`,
      task: () => promise.then(({ data }) => {
        const fileName = getLocalFileName(data.responseUrl);
        log.info(`saving ${fileName}`);
        data.pipe(createWriteStream(path.join(pathToOutputDir, fileName)));
      }),
    }
  ));
  return new Listr(tasks, { concurrent: true, exitOnError: false })
    .run().catch((error) => log.error(error));
};

export default (link, pathToDir) => {
  const pathToFile = path.join(pathToDir, generateFileName(link, '.html'));
  return axios.get(link).then(({ status, data }) => {
    if (status !== 200) return Promise.reject(new Error(`Page was not saved, status code is ${status}`));
    return fs.mkdir(pathToDir, { recursive: true }).then(() => {
      const localRecources = getLinksLocalResources(data, link);
      if (!hasLocalResources(localRecources)) {
        return fs.writeFile(pathToFile, data, 'utf-8').then(() => log.info('page was saved'));
      }
      log.info('changing of html');
      const pathToLocalFilesDir = path.join(pathToDir, generateFileName(link, '_files'));
      const updatedHtml = changeLocalResorces(data, pathToLocalFilesDir, link);
      return fs.mkdir(pathToLocalFilesDir)
        .then(() => saveResorces(localRecources, pathToLocalFilesDir))
        .then(() => fs.writeFile(pathToFile, updatedHtml, 'utf-8'));
    });
  }).catch((error) => {
    log.error(error);
    throw new Error(error);
  });
};
