// ==UserScript==
// @name            Mother's Day 2020
// @name:vi         Ngày Của Mẹ 2020
// @namespace       https://lelinhtinh.github.io
// @description     Download Mother’s Day card, created by Google Doodle.
// @description:vi  Tải thiệp Ngày Của Mẹ, được tạo bởi Google Doodle.
// @version         1.0.0
// @icon            https://i.imgur.com/MJayIyA.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://*.google.com/logos/2020/mothersday20/*/mothersday20.html*
// @require         https://cdn.jsdelivr.net/npm/selector-set@1.1.5/selector-set.js
// @require         https://cdn.jsdelivr.net/npm/selector-observer@2.1.6/dist/index.umd.js
// @require         https://cdn.jsdelivr.net/npm/file-saver@2.0.2/dist/FileSaver.min.js
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

/* global SelectorSet, SelectorObserver */
function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function addCssToDocument(css) {
  var style = document.createElement('style');
  style.innerText = css;
  document.head.appendChild(style);
}

function downloadImage(ori, callback) {
  const canvas = document.createElement('canvas');
  canvas.width = ori.width;
  canvas.height = ori.height - 103;

  const context = canvas.getContext('2d');
  context.fillStyle = ori.style.backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  ori.toBlob(blob => {
    const image = new Image();
    const url = URL.createObjectURL(blob);

    image.onload = () => {
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(function(blob) {
        saveAs(blob, IMG_NAME);
        context.clearRect(0, 0, canvas.width, canvas.height);
        callback(URL.createObjectURL(blob));
      });
    };

    image.src = url;
  });
}

addCssToDocument(`
a#mothersday20DownloadBtn {
  color: #fff;
  margin: 20px;
  border: none;
  outline: none;
  font-family: unset;
  font-size: 25px;
  height: 61px;
  text-align: center;
  filter: drop-shadow(0px 1px 1px rgba(54,47,39,0.75));
  animation-fill-mode: backwards;
  display: inline-block;
  vertical-align: top;
  line-height: 61px;
  width: 162px;
  text-decoration: none;
  cursor: pointer;
  position: absolute;
  right: 0;
  bottom: -3px;
}

a#mothersday20DownloadBtn:hover {
  transform: scale(1.05);
  filter: drop-shadow(0px 2px 2px rgba(54,47,39,0.75));
}

a#mothersday20DownloadBtn span {
  pointer-events: none;
}

a#mothersday20DownloadBtn span.icon {
  position: relative;
  float: left;
  left: 19px;
  top: 15px;
  width: 35px;
  height: 32px;
  padding: 0;
  margin: 0;
  transform: rotate(270deg);
  clip-path: ellipse(50% 50% at 50% 50%);
}
`);

let DOWNLOAD = 'Download';
let WAITING = 'Waiting...';
const IMG_NAME = 'mothersday20.png';

const params = new URLSearchParams(location.search);
if (params.has('hl') && params.get('hl') === 'vi') {
  DOWNLOAD = 'Tải xuống';
  WAITING = 'Chờ tí...';
}

let wait = false;
document.addEventListener('click', e => {
  const link = e.target;
  if (link.id !== 'mothersday20DownloadBtn' || link.tagName !== 'A') return;

  e.preventDefault();
  e.stopPropagation();
  if (wait) return;

  const linkText = link.querySelector('.text');
  linkText.textContent = WAITING;
  wait = true;

  const ori = document.querySelector('canvas#hpcanvas');
  downloadImage(ori, url => {
    wait = false;
    link.href = url;
    linkText.textContent = DOWNLOAD;
  });
});

const observer = new SelectorObserver.default(document.body, SelectorSet);
observer.observe('.ddlmdsb-G', el => {
  el.style.display = 'none';

  let link = document.querySelector('#mothersday20DownloadBtn');
  if (link === null) {
    link = document.createElement('a');
    link.id = 'mothersday20DownloadBtn';
    link.setAttribute(
      'style',
      'background: url(/logos/2020/mothersday20/r5/main-sprite.png) -1983.75px -264.75px / 2166px 774.75px no-repeat;'
    );
    link.innerHTML = `
      <span class="icon" style="background: url(/logos/2020/mothersday20/r5/main-sprite.png) -170.471px -628.765px / 2151.84px 769.686px no-repeat;"></span>
      <span class="text" style="font-size: 18px;">‪‪${DOWNLOAD}‬‬</span>
    `;
    link.download = IMG_NAME;
    link.rel = 'noopener';
    insertAfter(el, link);
  }
});
