// ==UserScript==
// @name            No Politics
// @name:vi         Phi Chính Trị
// @namespace       https://lelinhtinh.github.io
// @description     Remove political distractions
// @description:vi  Xóa nhưng phiền nhiễu liên quan đến chính trị
// @version         1.1.0
// @icon            https://i.imgur.com/24omnOZ.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://docs.nestjs.com/*
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-start
// @grant           GM_addStyle
// ==/UserScript==

GM_addStyle(`.top-bar {
  display: none;
}`);
