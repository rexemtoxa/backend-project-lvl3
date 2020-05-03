import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import axiosLog from 'axios-debug-log';
import Listr from 'listr';
import url from 'url';
import { generateFileName, isLocalResource, getLocalFileName } from './utils';

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

const genFullLinkFromLocalResource = (localLink, origin) => `${new URL(localLink, origin)}`;

const mappingAttributes = {
  link: 'href',
  img: 'src',
  script: 'src',
  a: 'href',
};

const changeSourceByType = (element, type, outputFolder) => {
  const fileName = getLocalFileName(cheerio(element).attr(type));
  const newLink = path.join(outputFolder, fileName);
  cheerio(element).attr(type, newLink);
};

const changeSourceElement = (element, outputFolder) => {
  const { name } = element;
  changeSourceByType(element, mappingAttributes[name], outputFolder);
};

const changeLocalResorces = (htmlPage, outputFolder, baseURL) => {
  const $ = cheerio.load(htmlPage);
  const elementsWithLocalResource = $('[src], [href]').toArray()
    .filter((element) => {
      const { name } = element;
      const link = $(element).attr(mappingAttributes[name]);
      return isLocalResource(link, url.parse(baseURL).hostname);
    });
  elementsWithLocalResource.forEach((element) => {
    changeSourceElement(element, outputFolder);
  });
  return $.html();
};


const getLinksLocalResources = (htmlPage, linkWithBaseUrl) => {
  const $ = cheerio.load(htmlPage);
  const { origin } = new URL(linkWithBaseUrl);
  return Object.keys(mappingAttributes)
    .flatMap((tagname) => $(tagname).toArray())
    .filter((node) => {
      const { name } = node;
      const link = $(node).attr(mappingAttributes[name]);
      return isLocalResource(link, origin);
    })
    .map((node) => {
      const { name } = node;
      const link = $(node).attr(mappingAttributes[name]);
      return genFullLinkFromLocalResource(link, origin);
    });
};

const hasLocalResources = (resources) => resources.length > 0;

const saveResorces = (listOfLinks, pathToOutputDir) => {
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
  let receivedHtml;
  let htmlForSaving;
  let localRecources;
  const pathToLocalFilesDir = path.join(pathToDir, generateFileName(link, '_files'));
  return axios.get(link)
    .then(({ data }) => { receivedHtml = data; })
    .then(() => fs.mkdir(pathToDir, { recursive: true }))
    .then(() => {
      localRecources = getLinksLocalResources(receivedHtml, link);
      htmlForSaving = !hasLocalResources(localRecources) ? receivedHtml
        : changeLocalResorces(receivedHtml, pathToLocalFilesDir, link);
    })
    .then(() => fs.writeFile(pathToFile, htmlForSaving, 'utf-8'))
    .then(() => (!hasLocalResources(localRecources) ? Promise.resolve()
      : fs.mkdir(pathToLocalFilesDir)))
    .then(() => saveResorces(localRecources, pathToLocalFilesDir))
    .catch((error) => {
      log.error(error);
      throw new Error(error);
    });
};
