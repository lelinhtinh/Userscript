// ==UserScript==
// @name            Facebook Adblocker
// @name:vi         Facebook Adblocker
// @namespace       https://lelinhtinh.github.io
// @description     Block all ads in Facebook News Feed.
// @description:vi  Chặn quảng cáo được tài trợ trên trang chủ Facebook.
// @version         1.2.0
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

(function () {
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

  const removeAds = (wrap, isWatch) => {
    if (DEBUG >= 2) console.log(wrap, 'wrapNode');
    if (DEBUG >= 2) console.log(isWatch, 'isWatch');

    const subtitles = wrap.querySelectorAll('[aria-label="Sponsored"], [aria-label="Được tài trợ"]');
    if (!subtitles.length) return;

    subtitles.forEach((v) => {
      v = v.closest(isWatch ? '[data-pagelet="MainFeed"]>div>div>div>div' : '[data-pagelet^="FeedUnit"]');
      if (DEBUG) console.log(++countAds, 'countAds');
      if (DEBUG >= 3) console.log(v.innerHTML, 'htmlAds');
      v.remove();
    });
  };

  let observerStory;
  let observerHead;

  const init = () => {
    if (DEBUG) console.log('Facebook Adblocker');

    const newsFeed = document.querySelector('[role="feed"], [data-pagelet="MainFeed"]');
    if (DEBUG >= 2) console.log(newsFeed, 'newsFeedNode');
    if (!newsFeed) return;

    if (observerStory) observerStory.disconnect();
    observerStory = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        removeAds(mutation.target, !newsFeed.getAttribute('role'));
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
