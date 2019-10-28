// ==UserScript==
// @name            anti social locker
// @name:vi         anti social locker
// @namespace       http://baivong.github.io/
// @description     Anti Social Locker plugin required user like or share before viewing content. If script doesn't work, please refresh the page to rebuild the cache and try again.
// @description:vi  Loại bỏ bảng Social Locker mà bắt buộc người dùng nhấn thích hoặc chia sẻ trước khi xem nội dung. Nếu script không hoạt động, hãy thử tải lại trang web.
// @version         1.1.4
// @icon            http://i.imgur.com/nOuUrIW.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*/*
// @match           https://*/*
// @require         https://code.jquery.com/jquery-3.3.1.slim.min.js
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-start
// @grant           none
// ==/UserScript==

(function(global) {
  'use strict';

  function setCookie(cname, cvalue, exdays, path) {
    var domain = '',
      d = new Date();
    if (exdays) {
      d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
      exdays = '; expires=' + d.toUTCString();
    }
    if (!path) path = '/';
    document.cookie = cname + '=' + cvalue + '; path=' + path + exdays + domain + ';';
  }

  function getCookie(name) {
    var cname = name + '=',
      cpos = document.cookie.indexOf(cname),
      cstart,
      cend;
    if (cpos !== -1) {
      cstart = cpos + cname.length;
      cend = document.cookie.indexOf(';', cstart);
      if (cend === -1) cend = document.cookie.length;
      return decodeURIComponent(document.cookie.substring(cstart, cend));
    }
    return null;
  }

  function addstyle(aCss) {
    if (document.getElementById('anti_social_locker_style') !== null) return;
    var head = document.head;
    if (!head) return;
    var style = document.createElement('style');
    style.id = 'anti_social_locker_style';
    style.setAttribute('type', 'text/css');
    style.textContent = aCss;
    head.appendChild(style);
    return style;
  }

  function antiSocialLocker() {
    // Panda Lockers (https://codecanyon.net/item/optin-panda-for-wordpress/10224279)
    // Social Locker for Wordpress (https://codecanyon.net/item/social-locker-for-wordpress/3667715)
    // Social Locker for jQuery (https://codecanyon.net/item/social-locker-for-jquery/3408941)
    (function() {
      if (
        !document.querySelectorAll('.onp-sl-content').length &&
        !document.querySelectorAll('[data-lock-id]').length &&
        !document.querySelectorAll('[data-locker-id]').length
      )
        return;
      addstyle(
        '.onp-sl-content,[data-lock-id],[data-locker-id]{display:block!important}.onp-sl,.onp-sl-transparence-mode,.onp-sl-overlap-box,[id^="content-locker"]{display:none!important}.onp-sl-blur-area{filter:none!important}'
      );
    })();

    // Social Share & Locker Pro Wordpress Plugin (http://codecanyon.net/item/social-share-locker-pro-wordpress-plugin/8137709)
    (function() {
      if (document.querySelector('.ism-locker') === null) return;
      addstyle(
        '[id^="indeed_locker_"]{display:none!important}[id^="indeed_locker_content_"]{filter:none!important;opacity:1!important;display:block!important}'
      );
    })();

    if (!('jQuery' in global)) return;

    // Easy Social Locker (https://codecanyon.net/item/easy-social-locker/6190651)
    (function($) {
      var $events = $._data(document, 'events'),
        $doc = $(document),
        str,
        cid;

      if (!$events || !$events.esll_button_action) return;

      $('script:not([src])').each(function() {
        var txt = this.textContent;

        if (txt.indexOf('esll_data') !== -1 && txt.indexOf('esll_button_action') !== -1) {
          str = txt;
          return false;
        }
      });

      if (str) cid = str.match(/var\scid\s?=\s?(\d+);/);

      if (cid) {
        cid = cid[1];
      } else {
        cid = str.match(/\['(google|linkedin)(-share)?',\s?(\d+)\]/);

        if (cid) {
          cid = cid[3];
        } else {
          cid = '0';
        }
      }

      if (cid !== '0') {
        $doc.trigger('esll_button_action', ['facebook-share', cid]);
      } else {
        $doc.trigger('esll_button_action');
      }
    })(jQuery);

    // ARSocial - Social Share & Social Locker (https://codecanyon.net/item/arsocial-social-share-social-locker/15218913)
    (function($) {
      var $pageId = $('#ars_page_id'),
        $lockId = $('#ars_locker_id'),
        $lockContents = $('.arsocialshare_locker_main_wrapper'),
        removeClass = 'ars_locked_full ars_locked_transparency ars_locked_blurring';

      if (!$pageId.length || !$lockId.length || !$lockContents.length) return;

      $lockContents.each(function() {
        var $this = $(this),
          $hidden = $('#' + $this.data('hidden-el'));

        $hidden.removeClass(removeClass).show();
        $this.replaceWith($hidden);
      });
    })(jQuery);

    // Viral Lock - Like, Google+1 or Tweet to Unlock (http://codecanyon.net/item/viral-lock-like-google1-or-tweet-to-unlock/1486602)
    // Viral Lock PHP - Like, Google+1 or Tweet to Unlock (http://codecanyon.net/item/viral-lock-php-like-google1-or-tweet-to-unlock/1632879)
    // Viral Coupon - Like, Tweet or G+ to get a Discount (http://codecanyon.net/item/viral-coupon-like-tweet-or-g-to-get-a-discount/2233568)
    (function($) {
      var $locked = $('.virallock-box, .virallocker-box, .virallocker-box-checkout'),
        host = global.location.host,
        str = '',
        pid,
        viralLock = /var\sdata\s?=\s?\{post:\s?"(\d+)",\s?action:/m,
        viralPHP = /"virallocker",\s?myID:\s?"(myid\d+)"\}/m,
        viralCoupon = /var\sdata\s?=\s?{\s?action:\s?"submit",\s?myID:\s?"(\d+)"\};/m,
        afterUnlock = function() {
          global.location.reload();
        },
        viralCookie;

      if (!$locked.length) return;

      $('script:not([src])').each(function() {
        var txt = this.textContent;

        if (txt.indexOf('virallocker_use') !== -1 && txt.indexOf('jQuery.post') !== -1) {
          str = txt;
          return false;
        }
      });

      if (str === '') return;

      if (viralLock.test(str)) {
        pid = str.match(viralLock);
        if (!pid) return;

        viralCookie = 'virallocker_' + pid[1];
        if (getCookie(viralCookie) !== null) return;
        setCookie(viralCookie, '0001', host);

        afterUnlock();
      } else if (viralPHP.test(str)) {
        pid = str.match(viralPHP);
        if (!pid) return;

        viralCookie = 'virallock_' + pid[1];
        if (getCookie(viralCookie) !== null) return;
        setCookie(viralCookie, '0001', host);

        afterUnlock();
      } else if (viralCoupon.test(str)) {
        pid = str.match(viralCoupon);
        if (!pid) return;

        if (getCookie('virallock_' + pid[1]) !== null && getCookie('virallock_time_' + pid[1]) !== null) return;

        /* globals virallocker_plusone */
        if ('virallocker_plusone' in global)
          virallocker_plusone({
            state: 'on',
          });
      }
    })(jQuery);
  }

  document.addEventListener('DOMContentLoaded', function() {
    antiSocialLocker();
    setTimeout(antiSocialLocker, 4000);
  });

  window.addEventListener('load', function() {
    antiSocialLocker();
    setTimeout(antiSocialLocker, 0);
  });
})(window);
