import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';
import url from 'url';
import { generateFileName, isLocalResource } from './utils';
import changeLocalResorces from './changeHtmlPage';

const getLinksLocalResources = (htmlPage, baseURL) => {
  const $ = cheerio.load(htmlPage);
  return $('[src], [href]').toArray()
    .map((element) => (_.isUndefined($(element).attr('src')) ? $(element).attr('href') : $(element).attr('src')))
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
  return fs.mkdir(pathToOutputDir).then(() => axios.all(requests)
    .then((responses) => responses.forEach((response) => {
      const fileName = path.basename(response.config.url);
      response.data.pipe(createWriteStream(path.join(pathToOutputDir, fileName)));
    })));
};


export default (link, pathToDir) => {
  const pathToFile = path.join(pathToDir, generateFileName(link, '.html'));
  return axios.get(link).then(({ status, data }) => {
    if (status === 200) {
      return fs.mkdir(pathToDir, { recursive: true }).then(() => {
        const localRecources = getLinksLocalResources(data, link);
        if (!hasLocalResources(localRecources)) {
          return fs.writeFile(pathToFile, data, 'utf-8').then(() => console.log('file was saved'));
        }
        const pathToLocalFilesDir = path.join(pathToDir, generateFileName(link, '_files'));
        const updatedHtml = changeLocalResorces(data, localRecources, pathToLocalFilesDir);
        return saveResorces(localRecources, pathToLocalFilesDir)
          .then(() => fs.writeFile(pathToFile, updatedHtml, 'utf-8'));
      });
    }
    return Promise.reject(new Error(`Page was not save, status code is ${status}`));
  });
};
