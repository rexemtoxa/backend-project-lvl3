import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import { isUndefined } from 'lodash';
import url from 'url';
import { generateFileName, isLocalResource, getLocalFileName } from './utils';
import changeLocalResorces from './changeHtmlPage';

const getLinksLocalResources = (htmlPage, baseURL) => {
  const $ = cheerio.load(htmlPage);
  return $('[src], [href]').toArray()
    .map((element) => (isUndefined($(element).attr('src')) ? $(element).attr('href') : $(element).attr('src')))
    .filter((link) => (isLocalResource(link, url.parse(baseURL).hostname)))
    .map((localLink) => (new URL(localLink, new URL(baseURL).origin)).href);
};

const hasLocalResources = (resources) => resources.length > 0;

const saveResorces = (listOfLinks, pathToOutputDir) => {
  const requests = listOfLinks.map((link) => axios({
    method: 'get',
    url: link,
    responseType: 'stream',
  }));
  requests.forEach((promise) => promise
    .catch((error) => {
      console.error(`failed to load resource ${error.config.url} because ${error.message}`);
    }));
  return fs.mkdir(pathToOutputDir).then(() => Promise.allSettled(requests))
    .then((responses) => responses
      .filter(({ status }) => status === 'fulfilled')
      .forEach(({ value }) => {
        const fileName = getLocalFileName(value.config.url);
        value.data.pipe(createWriteStream(path.join(pathToOutputDir, fileName)));
      }));
};

export default (link, pathToDir) => {
  const pathToFile = path.join(pathToDir, generateFileName(link, '.html'));
  return axios.get(link).then(({ status, data }) => {
    if (status !== 200) return Promise.reject(new Error(`Page was not save, status code is ${status}`));
    return fs.mkdir(pathToDir, { recursive: true }).then(() => {
      const localRecources = getLinksLocalResources(data, link);
      if (!hasLocalResources(localRecources)) {
        return fs.writeFile(pathToFile, data, 'utf-8').then(() => console.log('page was saved'));
      }
      const pathToLocalFilesDir = path.join(pathToDir, generateFileName(link, '_files'));
      const updatedHtml = changeLocalResorces(data, pathToLocalFilesDir, link);
      return saveResorces(localRecources, pathToLocalFilesDir)
        .then(() => fs.writeFile(pathToFile, updatedHtml, 'utf-8'))
        .finally(() => console.log('page was saved'));
    });
  });
};
