// ==UserScript==
// @name            ChiaSeNhac Helper
// @name:vi         ChiaSeNhac Helper
// @namespace       https://lelinhtinh.github.io
// @description     Download lossless music directly on ChiaSeNhac, bypass sharing dialog.
// @description:vi  Tải nhạc lossless trực tiếp tại ChiaSeNhac, không cần đăng nhập hoặc chia sẻ lên MXH.
// @version         1.3.0
// @icon            https://i.imgur.com/HLqWP3g.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://chiasenhac.vn/*
// @match           https://*.chiasenhac.vn/*
// @match           https://chiasenhac.com/*
// @match           https://*.chiasenhac.com/*
// @noframes
// @connect         chiasenhac.vn
// @connect         chiasenhac.com
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

(function () {
  'use strict';

  const getFlacLink = (downloadLink) =>
    downloadLink
      .replace(/\/download(\d\/)/, '/stream$1')
      .replace(/\/(128|320|m4a|32)\//, '/flac/')
      .replace(/\.(mp3|m4a)$/, '.flac');

  const $downloadItem = document.querySelector('a.download_item');
  const $downLossLess = document.querySelector('a#download_lossless');

  if (!$downLossLess) return;
  if (!$downLossLess.href) $downLossLess.setAttribute('href', getFlacLink($downloadItem.href));
  $downLossLess.setAttribute('target', '_blank');
  $downLossLess.setAttribute('title', $downloadItem.title);
  $downLossLess.setAttribute('style', 'color: #6610f2;');
  $downLossLess.classList.add('music_downloaded');
})();
