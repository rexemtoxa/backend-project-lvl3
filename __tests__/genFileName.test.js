import { generateFileName } from '../src/helpers';

test('generate file name from link', () => {
  const testcases = [
    {
      link: 'https://github.com/SeleniumHQ/docker-selenium',
      expectedResult: 'github-com-SeleniumHQ-docker-selenium.html',
    },
    {
      link: 'https://ru.hexlet.io/projects/4/members/7073',
      expectedResult: 'ru-hexlet-io-projects-4-members-7073.html',
    },
    {
      link: 'https://optibet.testrail.net/index.php?/plans/view/604',
      expectedResult: 'optibet-testrail-net-index-php-plans-view-604.html',
    },
    {
      link: 'https://www.w3.org/TR/WD-html40-970917/htmlweb.html',
      expectedResult: 'www-w3-org-TR-WD-html40-970917-htmlweb.html',
    },
    {
      link: 'https://abc:xyz@example.com',
      expectedResult: 'abc-xyz-example-com.html',
    },
  ];
  testcases.forEach(({ link, expectedResult }) => {
    expect(generateFileName(link)).toBe(expectedResult);
  });
});
