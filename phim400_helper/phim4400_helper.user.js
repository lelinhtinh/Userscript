// ==UserScript==
// @name            Phim4400 Helper
// @name:vi         Phim4400 Helper
// @namespace       https://lelinhtinh.github.io
// @description     Xem online và tải phim trực tiếp tại Phim4400, bỏ qua quảng cáo.
// @description:vi  Xem online và tải phim trực tiếp tại Phim4400, bỏ qua quảng cáo.
// @version         1.0.2
// @icon            https://i.imgur.com/wRRkkqr.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://phim440.cf/*
// @match           https://phim4400.cf/*
// @match           https://phim4400.tv/*
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

/* global shortcut */
(function() {
  'use strict';

  document.oncontextmenu = null;
  if (shortcut) {
    shortcut.remove('Ctrl+U');
    shortcut.remove('F12');
    shortcut.remove('Ctrl+Shift+I');
    shortcut.remove('Ctrl+S');
    shortcut.remove('Ctrl+Shift+C');
  }

  var btn = document.querySelector('.button-phim'),
    link = btn.href;

  link = /(&|\?)url=([^&\s\n?#!]+)/.exec(link);
  if (!link) return;
  link = link[2];
  if (!link) return;
  link = atob(link);
  btn.href = link;
  btn.setAttribute('target', '_top');
})();
