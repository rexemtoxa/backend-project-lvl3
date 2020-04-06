import url from 'url';
import path from 'path';

export const generateFileName = (link, type) => {
  const { auth, host } = url.parse(link);
  const pathToResource = url.parse(link).path;
  const partsOfName = [auth, host, pathToResource];
  return `${partsOfName.filter((partOfName) => partOfName !== null && partOfName).join('-').replace(/-\/$/, '')
    .replace(/[\W]/g, '-')
    .replace(/-{1,}/g, '-')}${type}`.replace(/-html\.html$/, `${type}`);
};

export const isLocalResource = (source, baseHost) => {
  const { hostname } = url.parse(source);
  return !hostname || hostname === baseHost;
};

export const getLocalFileName = (link) => {
  const { base, ext } = path.parse(link);
  return !ext ? `${base}.html` : base;
};
