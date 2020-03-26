import url from 'url';
// eslint-disable-next-line import/prefer-default-export
export const generateFileName = (link) => {
  const { auth, host, path } = url.parse(link);
  const partsOfName = [auth, host, path];
  return `${partsOfName.filter((partOfName) => partOfName !== null && partOfName).join('-').replace(/-\/$/, '')
    .replace(/[\W]/g, '-')
    .replace(/-{1,}/g, '-')}.html`.replace(/-html\.html$/, '.html');
};