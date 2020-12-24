// ==UserScript==
// @name            Facebook Adblocker
// @name:vi         Facebook Adblocker
// @namespace       https://lelinhtinh.github.io
// @description     Block all ads in Facebook News Feed.
// @description:vi  Chặn quảng cáo được tài trợ trên trang chủ Facebook.
// @version         1.3.2
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

  let adsCount = 0;
  let labelStore = null;
  let observerLabel;
  let observerStory;
  let observerHead;

  const removeAd = (adsLabel) => {
    const adsWrap = adsLabel.closest(location.pathname.startsWith('/watch') ? '._6x84' : '[data-pagelet^="FeedUnit"]');
    // adsWrap.style.opacity = 0.1;
    adsWrap.remove();
    console.log(++adsCount, 'adsCount');
  };

  const findAds = (wrapper) => {
    function pickAds() {
      if (labelStore instanceof Array) {
        if (!labelStore.length) return;
        const labelId = labelStore.pop();

        const adsLabel = wrapper.querySelector('span[aria-labelledby="' + labelId + '"][class]');
        if (adsLabel === null) return;

        removeAd(adsLabel);
        pickAds();
      } else {
        const adsLabels = wrapper.querySelectorAll('a[aria-label="Sponsored"], a[aria-label="Được tài trợ"]');
        if (!adsLabels.length) return;

        adsLabels.forEach(removeAd);
      }
    }
    pickAds();

    const watchLabel = (labelHidden) => {
      if (observerLabel) return;
      observerLabel = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'id' &&
            /(Được\s+tài\s+trợ|Sponsored)/i.test(mutation.target.textContent.trim())
          ) {
            labelStore.push(mutation.target.id);
            pickAds();
          }
        }
      });
      observerLabel.observe(labelHidden, {
        attributes: true,
        attributeFilter: ['id'],
        subtree: true,
      });
    };

    const labelHidden = document.querySelector('[hidden="true"]');
    if (labelHidden === null) {
      labelStore = null;
      if (observerLabel) {
        observerLabel.disconnect();
        observerLabel = null;
      }
    } else {
      labelStore = [];
      watchLabel(labelHidden);
    }
  };

  const init = () => {
    const newsFeed = document.querySelector('[role="feed"], [data-pagelet="MainFeed"]');
    if (newsFeed === null) return;

    if (observerStory) observerStory.disconnect();
    observerStory = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        findAds(mutation.target);
      }
    });
    observerStory.observe(newsFeed, {
      attributes: false,
      childList: true,
      subtree: true,
    });

    findAds(document);
  };

  init();

  if (observerHead) observerHead.disconnect();
  observerHead = new MutationObserver(init);
  observerHead.observe(document.head, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  (function (old) {
    window.history.pushState = function () {
      old.apply(window.history, arguments);
      init();
    };
  })(window.history.pushState);
})();
