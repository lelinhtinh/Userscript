// ==UserScript==
// @name            FreeCodeCamp No Pop-up
// @name:vi         FreeCodeCamp Không Phiền Phức
// @namespace       https://lelinhtinh.github.io
// @description     Remove all popup in FreeCodeCamp
// @description:vi  Xóa các bảng xác nhận trên FreeCodeCamp
// @version         1.0.0
// @icon            https://www.freecodecamp.org/icons/icon-72x72.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://www.freecodecamp.org/learn/*
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @grant           GM_addStyle
// ==/UserScript==

GM_addStyle(`[role="dialog"]:not([class]) {
  visibility: hidden;
  pointer-events: none;
}`);

const targetNode = document.body;
const observerOptions = {
  childList: false,
  attributes: true,
};
const removePopup = () => {
  const $submit = document.querySelector('.modal button:not(.close,.confirm-donation-btn)');
  if ($submit) $submit.click();
};
const watchBody = (mutationList, observer) => {
  mutationList.forEach((mutation) => {
    if (mutation.type !== 'attributes') return;
    if (mutation.attributeName === 'class' && targetNode.classList.contains('modal-open')) removePopup();
  });
};
const observer = new MutationObserver(removePopup);
observer.observe(targetNode, observerOptions);
