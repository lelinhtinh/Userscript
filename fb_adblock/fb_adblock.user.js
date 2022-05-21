// ==UserScript==
// @name            Facebook Adblocker
// @name:vi         Facebook Adblocker
// @namespace       https://lelinhtinh.github.io
// @description     Block all ads in Facebook News Feed.
// @description:vi  Chặn quảng cáo được tài trợ trên trang chủ Facebook.
// @version         1.4.1
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

/**
 * Facebook sponsor labels
 * @type {string[]}
 */
const sponsorLabelConfigs = ['Được tài trợ', 'Sponsored'];

/* === DO NOT CHANGE ANYTHING BELOW THIS LINE === */

(function () {
  'use strict';

  /** @type Element */
  let labelHidden = null;
  /** @type string[]|null */
  let labelStore = null;
  /** @type MutationObserver */
  let observerLabel;
  /** @type MutationObserver */
  let observerStory;
  /** @type MutationObserver */
  let observerHead;
  /** @type IntersectionObserver */
  let observerScroll;

  /**
   * @param {string} label
   * @param {boolean} removeSpaces
   * @returns {boolean}
   */
  const isSponsorLabel = (label, removeSpaces = false) => {
    if (!removeSpaces) return sponsorLabelConfigs.includes(label);
    return sponsorLabelConfigs.map((label) => label.replace(/\s/g, '')).includes(label);
  };

  const articleSelector = () => (location.pathname.startsWith('/watch') ? '._6x84' : '[role="article"]');

  /**
   * @param {Element} sponsorLabel
   */
  const removeSponsor = (sponsorLabel) => {
    const sponsorWrapper = sponsorLabel.closest(articleSelector());
    // sponsorWrapper.style.opacity = 0.1;
    sponsorWrapper.remove();
    console.count('UserScript Facebook Adblocker');
  };

  /**
   * @param {Element} wrapper
   */
  const detectSponsor = (wrapper) => {
    let sponsorLabelSelector = ['a[href^="/ads/"]'];
    sponsorLabelSelector.push(...sponsorLabelConfigs.map((label) => `a[aria-label="${label}"]`));

    const sponsorLabels = wrapper.querySelectorAll(sponsorLabelSelector);
    if (sponsorLabels.length) sponsorLabels.forEach(removeSponsor);

    const obfuscatedLabels = wrapper.querySelectorAll('span[style="display: flex; order: 0;"]');
    if (obfuscatedLabels.length) {
      obfuscatedLabels.forEach((obfuscatedLabel) => {
        const temp = [];
        obfuscatedLabel.querySelectorAll('span[style^="order: "]').forEach((span) => {
          if (
            getComputedStyle(span).getPropertyValue('display') === 'none' ||
            getComputedStyle(span).getPropertyValue('position') === 'absolute'
          )
            return;

          const order = parseInt(span.style.order, 10);
          temp[order] = span.textContent.trim();
        });

        const label = temp.join('');
        if (isSponsorLabel(label, true)) removeSponsor(obfuscatedLabel);
      });
    }
  };

  /**
   * @param {Element} wrapper
   */
  const findSponsor = (wrapper = document) => {
    if (labelStore instanceof Array) {
      if (!labelStore.length) return;
      const labelId = labelStore.pop();

      const sponsorLabel = wrapper.querySelector('span[aria-labelledby="' + labelId + '"][class]');
      if (sponsorLabel === null) return;

      removeSponsor(sponsorLabel);
      findSponsor(wrapper);
    }

    detectSponsor(wrapper);
  };

  /**
   * @param {Element} labelHidden
   */
  const watchLabel = (labelHidden) => {
    if (observerLabel) return;
    observerLabel = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'id' &&
          isSponsorLabel(mutation.target.textContent.trim())
        ) {
          labelStore.push(mutation.target.id);
          findSponsor();
        }
      }
    });
    observerLabel.observe(labelHidden, {
      attributes: true,
      attributeFilter: ['id'],
      subtree: true,
    });
  };

  const init = () => {
    const newsFeed = document.querySelector('[role="feed"], #watch_feed');
    if (newsFeed === null) return;

    // Find while scrolling
    if (observerScroll) observerScroll.disconnect();
    observerScroll = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.intersectionRatio) return;
        detectSponsor(entry.target);
      });
    });
    newsFeed.querySelectorAll(articleSelector()).forEach((article) => {
      observerScroll.observe(article);
    });

    // Find on DOM change
    if (observerStory) observerStory.disconnect();
    observerStory = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        findSponsor(mutation.target);
        mutation.target.querySelectorAll(articleSelector()).forEach((article) => {
          observerScroll.observe(article);
        });
      }
    });
    observerStory.observe(newsFeed, {
      attributes: false,
      childList: true,
      subtree: true,
    });
    findSponsor();

    // Find on label list change
    if (labelHidden === null) {
      labelHidden = document.querySelector('[hidden="true"]');
      if (labelHidden === null) {
        labelStore = null;
        if (observerLabel) {
          observerLabel.disconnect();
          observerLabel = null;
        }
      } else {
        labelStore = [];
        labelHidden.querySelectorAll('span').forEach((target) => {
          if (isSponsorLabel(target.textContent.trim())) {
            labelStore.push(target.id);
            findSponsor();
          }
        });
        watchLabel(labelHidden);
      }
    }
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
