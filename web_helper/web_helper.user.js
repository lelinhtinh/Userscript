// ==UserScript==
// @name            NovelHelper
// @name:vi         NovelHelper
// @namespace       https://lelinhtinh.github.io
// @description     Add navigation features to some web novels.
// @description:vi  Bổ sung tính năng điều hướng cho một vài trang web truyện.
// @version         1.3.0
// @icon            https://i.imgur.com/FHgT0E4.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://tienhieptruyen.net/*
// @match           https://truyendich.com/*
// @match           https://bachngocsach.com/reader/*
// @require         https://unpkg.com/hotkeys-js/dist/hotkeys.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM_addStyle
// @inject-into     content
// ==/UserScript==

/* global hotkeys */
const k = hotkeys.noConflict();

let chapSelector, preSelector, nextSelector;
switch (location.host) {
  case 'tienhieptruyen.net':
    chapSelector = '.chapter-c';
    preSelector = () => {
      const preBtn = document.querySelector('.chap-header .btn-next:not([disabled]) .fa-angle-double-left');
      if (preBtn === null) return;
      preBtn.parentNode.click();
    };
    nextSelector = () => {
      const nextBtn = document.querySelector('.chap-header .btn-next:not([disabled]) .fa-angle-double-right');
      if (nextBtn === null) return;
      nextBtn.parentNode.click();
    };
    break;
  case 'truyendich.com':
    chapSelector = '#read-content';
    preSelector = '.btn-chapter-pre:not(.disable)';
    nextSelector = '.btn-chapter-next:not(.disable)';
    break;
  case 'bachngocsach.com':
    chapSelector = '#noi-dung';
    preSelector = '.page-prev:not(.invisible)';
    nextSelector = '.page-next:not(.invisible)';
    GM.addStyle(`
      .page-menu{position:relative!important}
      #backtotop,.qc-chuong-top,#thongbao,#chuong-footer,#liked-list,#like-note,.qc-chuong,#thaoluan,#noi-dung~.chuong-nav{display:none!important}
    `);
    break;
  default:
    console.log('NovelHelper: Unknown host');
}

const chapter = document.querySelector(chapSelector);
chapter.scrollIntoView();

const navChap = (btnSelector) => {
  const button = document.querySelector(btnSelector);
  if (button === null) return;
  button.click();
};

k('left', () => {
  if (typeof preSelector === 'string') {
    navChap(preSelector);
  } else {
    preSelector();
  }
});

k('right', () => {
  if (typeof nextSelector === 'string') {
    navChap(nextSelector);
  } else {
    nextSelector();
  }
});

const contentLineHeight = () => parseFloat(getComputedStyle(chapter).lineHeight);

k('up', () => {
  document.documentElement.scrollTop -= window.innerHeight - contentLineHeight() * 2;
});

let endChapter = false;
k('down', () => {
  if (endChapter) {
    k.trigger('right');
    return;
  }

  document.documentElement.scrollTop += window.innerHeight - contentLineHeight() * 2;

  const chapterRect = chapter.getBoundingClientRect();
  if (
    chapterRect.top + chapterRect.height - window.innerHeight + contentLineHeight() * 2 < 0 ||
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
