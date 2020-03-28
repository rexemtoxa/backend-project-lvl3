[![Maintainability](https://api.codeclimate.com/v1/badges/05eefd3f46e12d75032e/maintainability)](https://codeclimate.com/github/rexemtoxa/project-lvl3-s390/maintainability)  [![Test Coverage](https://api.codeclimate.com/v1/badges/05eefd3f46e12d75032e/test_coverage)](https://codeclimate.com/github/rexemtoxa/project-lvl3-s390/test_coverage) ![pageLoader](https://github.com/rexemtoxa/backend-project-lvl3/workflows/pageLoader/badge.svg?branch=master)


# Page-loader
### Install:
```npm i page_loader_ar```<button onclick="myFunction()" style="margin-left: 15px;">Copy</button>

### Usage:

<script>
function myFunction() {
  const code = event.target.previousSibling.textContent;
  const tempElement = document.createElement('textarea');
   tempElement.value = code;
   tempElement.setAttribute('readonly', '');
   tempElement.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(tempElement);
   tempElement.select();
   document.execCommand('copy');
   document.body.removeChild(tempElement);
}
</script>