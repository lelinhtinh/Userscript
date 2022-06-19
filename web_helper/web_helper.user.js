// ==UserScript==
// @name            WebHelper
// @name:vi         WebHelper
// @namespace       https://lelinhtinh.github.io
// @description     Add some useful features to some websites.
// @description:vi  Bổ sung một số tính năng hữu ích cho một vài trang web.
// @version         1.0.0
// @icon            https://i.imgur.com/FHgT0E4.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://tienhieptruyen.net/*
// @require         https://unpkg.com/hotkeys-js/dist/hotkeys.min.js
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// @inject-into     content
// ==/UserScript==

/* global hotkeys */
const k = hotkeys.noConflict();

const chapter = document.querySelector('.chapter-c');
chapter.scrollIntoView();

let lineHeight = parseFloat(getComputedStyle(chapter).lineHeight);
document.querySelector('.chap-list-update .font-size').addEventListener('change', () => {
  setTimeout(() => {
    lineHeight = parseFloat(getComputedStyle(chapter).lineHeight);
  }, 100);
});

k('left', () => {
  chapter.querySelector('.chap-header .btn-next .fa-angle-double-left').parentNode.click();
});
k('right', () => {
  chapter.querySelector('.chap-header .btn-next .fa-angle-double-right').parentNode.click();
});

k('up', () => {
  document.documentElement.scrollTop -= window.innerHeight - lineHeight;
});
k('down', () => {
  document.documentElement.scrollTop += window.innerHeight - lineHeight;
});
