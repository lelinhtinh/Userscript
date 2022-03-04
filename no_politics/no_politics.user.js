// ==UserScript==
// @name            No Politics
// @name:vi         Phi Chính Trị
// @namespace       https://lelinhtinh.github.io
// @description     Remove political distractions
// @description:vi  Xóa nhưng phiền nhiễu liên quan đến chính trị
// @version         1.0.0
// @icon            https://i.imgur.com/24omnOZ.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://gitlab.com/*
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-start
// @grant           GM_addStyle
// ==/UserScript==

GM_addStyle(`#logo {
  width: calc(28px + 8px * 2);
  height: calc(28px + 2px * 2);
  background: url(https://gitlab.com/assets/gitlab_logo-7ae504fe4f68fdebb3c2034e36621930cd36ea87924c11ff65dbcb8ed50dca58.png)
    no-repeat center center;
  background-size: cover;
  background-origin: content-box;
}
#logo img {
  display: none;
}`);
