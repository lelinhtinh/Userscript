// ==UserScript==
// @name            Facebook Adblocker
// @name:vi         Facebook Adblocker
// @namespace       https://lelinhtinh.github.io
// @description     Block all ads in Facebook News Feed.
// @description:vi  Chặn quảng cáo được tài trợ trên trang chủ Facebook.
// @version         1.4.6
// @icon            https://i.imgur.com/F8ai0jB.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://facebook.com/*
// @match           https://*.facebook.com/*
// @require         https://unpkg.com/throttle-debounce@5.0.0/umd/index.js
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

/**
 * Facebook sponsor labels
 */
const sponsorLabelConfigs = {
  en: ['Sponsored'],
  vi: ['Được tài trợ'],
};

/**
 * @type {'remove'|'fade'}
 */
const sponsorHideMode = 'remove';

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

  let sponsorLangConfigs =
    sponsorLabelConfigs[navigator.language.split('-')[0] || document.documentElement.lang || sponsorLabelConfigs.en];
  /**
   * @param {string} label
   * @param {boolean} removeSpaces
   * @returns {boolean}
   */
  const isSponsorLabel = (label, removeSpaces = false) => {
    if (!removeSpaces) return sponsorLangConfigs.includes(label);
    return sponsorLangConfigs.map((label) => label.replace(/\s/g, '')).includes(label);
  };

  const feedSelector = () => (location.pathname.startsWith('/watch') ? '#watch_feed' : '[role="feed"]');
  const articleSelector = () => (location.pathname.startsWith('/watch') ? '._6x84' : '[role="article"]');

  /**
   * @param {Element} sponsorLabel
   */
  const removeSponsor = (sponsorLabel) => {
    const sponsorWrapper = sponsorLabel.closest(articleSelector());
    if (sponsorWrapper === null) return;
    console.count('UserScript Facebook Adblocker');

    if (sponsorHideMode === 'fade') {
      sponsorWrapper.style.opacity = 0.1;
      sponsorWrapper.style.transition = 'opacity 400ms ease-in-out 0s';
      sponsorWrapper.addEventListener('mouseenter', () => {
        sponsorWrapper.style.opacity = 1;
      });
      sponsorWrapper.addEventListener('mouseleave', () => {
        sponsorWrapper.style.opacity = 0.1;
      });
    } else {
      sponsorWrapper.remove();
    }
  };

  /**
   * @param {Element} wrapper
   */
  const detectSponsor = (wrapper) => {
    let sponsorLabelSelector = ['a[href^="/ads/"]'];
    sponsorLabelSelector.push(...sponsorLangConfigs.map((label) => `a[aria-label="${label}"]`));

    const sponsorLabels = wrapper.querySelectorAll(sponsorLabelSelector.join(','));
    if (sponsorLabels.length) sponsorLabels.forEach(removeSponsor);

    const obfuscatedLabels = wrapper.querySelectorAll('[style="display: flex;"]');
    if (obfuscatedLabels.length) {
      obfuscatedLabels.forEach((obfuscatedLabel) => {
        const temp = [];
        obfuscatedLabel.querySelectorAll('div').forEach((span) => {
          if (
            getComputedStyle(span).getPropertyValue('display') === 'none' ||
            getComputedStyle(span).getPropertyValue('position') === 'absolute'
          )
            return;

          const order = parseInt(getComputedStyle(span).getPropertyValue('order'), 10);
          temp[order] = span.textContent.trim();
        });

        const label = temp.join('').replace(/\s/g, '');
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

  // Find while scrolling
  observerScroll = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.intersectionRatio) return;
      detectSponsor(entry.target);
    });
  });

  const init = throttleDebounce.debounce(300, () => {
    const newsFeed = document.querySelector(feedSelector());
    if (newsFeed === null) return;

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
  });
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
