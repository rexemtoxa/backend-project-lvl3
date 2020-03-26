import { generateFileName } from '../src/utils';

const testcases = [
  {
    link: 'https://github.com/SeleniumHQ/docker-selenium',
    fileName: 'github-com-SeleniumHQ-docker-selenium.html',
  },
  {
    link: 'https://ru.hexlet.io/projects/4/members/7073',
    fileName: 'ru-hexlet-io-projects-4-members-7073.html',
  },
  {
    link: 'https://optibet.testrail.net/index.php?/plans/view/604',
    fileName: 'optibet-testrail-net-index-php-plans-view-604.html',
  },
  {
    link: 'https://www.w3.org/TR/WD-html40-970917/htmlweb.html',
    fileName: 'www-w3-org-TR-WD-html40-970917-htmlweb.html',
  },
  {
    link: 'https://abc:xyz@example.com',
    fileName: 'abc-xyz-example-com.html',
  },
];

describe.each(testcases)('generate filename from link', ({ link, fileName }) => {
  test(`generate filename from ${link}`, () => {
    expect(generateFileName(link)).toBe(fileName);
  });
});
