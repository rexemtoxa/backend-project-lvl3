import url from 'url';
import path from 'path';
import cheerio from 'cheerio';

const tagsWithHrefAttribut = new Set(['A', 'AREA', 'BASE', 'LINK']);

const changeSourceByType = (element, type, outputFolder) => {
  const fileName = path.basename(cheerio(element).attr(type));
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

export default (htmlPage, localResources, outputFolder) => {
  const dom = cheerio.load(htmlPage);
  localResources.forEach((link) => {
    const { pathname } = url.parse(link);
    const currentElement = dom(`[src='${pathname.slice(1)}'], [href='${pathname.slice(1)}']`);
    changeSourceElement(currentElement, outputFolder);
  });
  return dom.html();
};
