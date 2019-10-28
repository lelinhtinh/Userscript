// ==UserScript==
// @name            Pixiv Comic Downloader
// @name:vi         Pixiv Comic Downloader
// @namespace       https://lelinhtinh.github.io
// @description     Download manga on Pixiv.
// @description:vi  Tải truyện tranh tại Pixiv.
// @version         0.0.3
// @icon            https://i.imgur.com/ZmH0sdx.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://comic.pixiv.net/*
// @require         https://unpkg.com/jszip@3.2.1/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasyfork.org/scripts/5679-wait-for-elements/code/Wait%20For%20Elements.js?version=250853
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         *
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           GM_registerMenuCommand
// ==/UserScript==

GM.xmlHttpRequest({
  method: 'GET',
  url: 'https://comic.pixiv.net/api/v1/viewer/stories/wqW7jbjAjL/46529.json',
  responseType: 'json',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  onload: function(response) {
    console.log('Data', response.response);
  },
  onerror: function(err) {
    console.error(err);
  },
});

GM.xmlHttpRequest({
  method: 'GET',
  url: 'https://img-comic.pximg.net/c!/q=50,f=webp%3Ajpeg/images/page/46529/uWvYU8JvmqiLuZMnPDBy/3.jpg?20190417102900',
  responseType: 'arraybuffer',
  headers: {
    referer: 'https://comic.pixiv.net',
    origin: 'https://comic.pixiv.net',
  },
  onload: function(response) {
    console.log('Image', response.response);
  },
  onerror: function(err) {
    console.error(err);
  },
});

/* global waitForElems */
waitForElems({
  sel: 'a.episode-list-item.horizontal[href^="/viewer/stories/"]',
  onmatch: function(a) {
    console.log('Chapter', a);
  },
});

// GM_registerMenuCommand('Download', function () {

// });

GM_addStyle(
  'a.episode-list-item.horizontal[href^="/viewer/stories/"]{background-image:-webkit-gradient(linear,left top,right top,from(#ffc400),to(#fcec00));background-image:-webkit-linear-gradient(left,#ffc400,#fcec00);background-image:-o-linear-gradient(left,#ffc400,#fcec00);background-image:linear-gradient(to right,#ffc400,#fcec00)}'
);
