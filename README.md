[![Maintainability](https://api.codeclimate.com/v1/badges/05eefd3f46e12d75032e/maintainability)](https://codeclimate.com/github/rexemtoxa/project-lvl3-s390/maintainability)  [![Test Coverage](https://api.codeclimate.com/v1/badges/05eefd3f46e12d75032e/test_coverage)](https://codeclimate.com/github/rexemtoxa/project-lvl3-s390/test_coverage) ![pageLoader](https://github.com/rexemtoxa/backend-project-lvl3/workflows/pageLoader/badge.svg?branch=master)


# Page-loader
### Install:
```$ npm i page_loader_ar```     <button onclick="myFunction()">Copy text</button>

<code>def useage(self)</code>
### Usage:


<input type="text" value="Hello World" id="myInput">
<button onclick="myFunction()">Copy text</button>


<!-- <script>
function myFunction() {
  var copyText = document.getElementById("myInput");
  copyText.select();
  copyText.setSelectionRange(0, 99999)
  document.execCommand("copy");
  alert("Copied the text: " + copyText.value);
}
</script> -->

<script>
function myFunction() {
  var copyText = document.getElementById("myInput");
  copyText.innerHTML = '<p>'
}
</script>

<script>
document.getElementById("myInput").innerHTML = "Text added by JavaScript code";
</script>