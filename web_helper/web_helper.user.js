// ==UserScript==
// @name            WebHelper
// @name:vi         WebHelper
// @namespace       https://lelinhtinh.github.io
// @description     Add some useful features to some websites.
// @description:vi  Bổ sung một số tính năng hữu ích cho một vài trang web.
// @version         1.1.2
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

document.querySelector('.chap-content').style.userSelect = 'auto';
chapter.querySelectorAll('[style]').forEach((e) => {
  e.remove();
});
document.addEventListener(
  'contextmenu',
  (e) => {
    e.stopPropagation();
  },
  true,
);

let lineHeight = parseFloat(getComputedStyle(chapter).lineHeight);
document.querySelector('.chap-list-update .font-size').addEventListener('change', () => {
  setTimeout(() => {
    lineHeight = parseFloat(getComputedStyle(chapter).lineHeight);
  }, 100);
});

k('left', () => {
  document.querySelector('.chap-header .btn-next .fa-angle-double-left').parentNode.click();
});

k('right', () => {
  document.querySelector('.chap-header .btn-next .fa-angle-double-right').parentNode.click();
});

k('up', () => {
  document.documentElement.scrollTop -= window.innerHeight - lineHeight * 2;
});

let endChapter = false;
k('down', () => {
  if (endChapter) {
    k.trigger('right');
    return;
  }

  document.documentElement.scrollTop += window.innerHeight - lineHeight * 2;

  const chapterRect = chapter.getBoundingClientRect();
  if (
    chapterRect.top + chapterRect.height - window.innerHeight + lineHeight * 2 < 0 ||
    document.documentElement.scrollTop + window.innerHeight === document.documentElement.scrollHeight
  ) {
    endChapter = true;
  }
});

document.addEventListener(
  'touchstart',
  (e) => {
    if (e.changedTouches[0].clientX < (window.innerWidth / 100) * 40) {
      k.trigger('up');
    } else {
      k.trigger('down');
    }
  },
  true,
);
