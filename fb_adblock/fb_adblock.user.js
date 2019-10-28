// ==UserScript==
// @name            Facebook Adblocker
// @name:vi         Facebook Adblocker
// @namespace       https://lelinhtinh.github.io
// @description     Block all ads in Facebook News Feed.
// @description:vi  Chặn quảng cáo được tài trợ trên trang chủ Facebook.
// @version         1.1.3
// @icon            https://i.imgur.com/F8ai0jB.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://facebook.com/*
// @match           https://*.facebook.com/*
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

(function() {
  'use strict';

  /**
   * Logging level
   * @type {Number}
   */
  const DEBUG = 0;

  /* === DO NOT CHANGE === */
  let countAds = 0;

  const config = {
    attributes: false,
    childList: true,
    subtree: true,
  };

  const removeAds = wrap => {
    if (DEBUG >= 2) console.log(wrap, 'wrapNode');

    const subtiltes = wrap.querySelectorAll('[data-testid*="story"]:not([role]) a');
    if (!subtiltes.length) return;

    Array.from(subtiltes).forEach(v => {
      if (v.textContent.trim().search(/Được tài trợ|Bài viết được đề xuất|Sponsor|Suggest|Recommend/i) !== -1) {
        v = v.closest('[data-testid="fbfeed_story"]');
        if (DEBUG) console.log(++countAds, 'countAds');
        if (DEBUG >= 3) console.log(v.innerHTML, 'htmlAds');
        v.remove();
      }
    });
  };

  let observerStory;
  let observerHead;

  const init = () => {
    if (DEBUG) console.log('Facebook Adblocker');
    countAds = 0;

    const newsFeed = document.querySelector('[data-testid="newsFeedStream"]');
    if (DEBUG >= 2) console.log(newsFeed, 'newsFeedNode');
    if (!newsFeed) return;

    if (observerStory) observerStory.disconnect();
    observerStory = new MutationObserver(mutationsList => {
      for (let mutation of mutationsList) {
        removeAds(mutation.target);
      }
    });
    observerStory.observe(newsFeed, config);

    removeAds(document);
  };

  init();

  if (observerHead) observerHead.disconnect();
  observerHead = new MutationObserver(init);
  observerHead.observe(document.head, config);
})();
