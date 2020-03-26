import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { generateFileName } from './utils';


export default (url, pathToDir) => {
  const pathToFile = path.join(pathToDir, generateFileName(url));
  return axios.get(url).then(({ status, data }) => {
    if (status === 200) {
      return fs.mkdir(pathToDir, { recursive: true }).then(
        fs.writeFile(pathToFile, data, 'utf-8').then(() => console.log('file was saved')),
      );
    }
    return Promise.reject(new Error(`Request failed with status code ${status}`));
  });
};
