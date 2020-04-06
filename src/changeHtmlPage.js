import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';
import { isLocalResource, getLocalFileName } from './utils';

const tagsWithHrefAttribut = new Set(['A', 'AREA', 'BASE', 'LINK']);

const changeSourceByType = (element, type, outputFolder) => {
  const fileName = getLocalFileName(cheerio(element).attr(type));
  const newLink = path.join(outputFolder, fileName);
  cheerio(element).attr(type, newLink);
};

const changeSourceElement = (element, outputFolder) => {
  if (tagsWithHrefAttribut.has(cheerio(element).prop('tagName'))) {
    changeSourceByType(element, 'href', outputFolder);
  } else {
    changeSourceByType(element, 'src', outputFolder);
  }
};

export default (htmlPage, outputFolder, baseURL) => {
  const $ = cheerio.load(htmlPage);
  const elementsWithLocalResource = $('[src], [href]').toArray()
    .filter((element) => {
      const link = _.isUndefined($(element).attr('src')) ? $(element).attr('href') : $(element).attr('src');
      return isLocalResource(link, url.parse(baseURL).hostname);
    });
  elementsWithLocalResource.forEach((element) => {
    changeSourceElement(element, outputFolder);
  });
  return $.html();
};
