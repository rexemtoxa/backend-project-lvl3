import url from 'url';
// eslint-disable-next-line import/prefer-default-export
export const generateFileName = (link, type) => {
  const { auth, host, path } = url.parse(link);
  const partsOfName = [auth, host, path];
  return `${partsOfName.filter((partOfName) => partOfName !== null && partOfName).join('-').replace(/-\/$/, '')
    .replace(/[\W]/g, '-')
    .replace(/-{1,}/g, '-')}${type}`.replace(/-html\.html$/, `${type}`);
};

export const isLocalResource = (source, baseHost) => {
  const { hostname } = url.parse(source);
  return !hostname || hostname === baseHost;
};
