// ==UserScript==
// @name         anti social locker
// @namespace    http://baivong.github.io/
// @description  Anti social locker plugin required user like or share before viewing content. If script doesn't work, please refresh the page to rebuild the cache and try again.
// @version      1.0.2
// @icon         http://i.imgur.com/nOuUrIW.png
// @author       Zzbaivong
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function (global) {
    'use strict';

    function antiSocialLocker() {

        // Panda Lockers (https://codecanyon.net/item/optin-panda-for-wordpress/10224279)
        // Social Locker for Wordpress (https://codecanyon.net/item/social-locker-for-wordpress/3667715)
        (function () {
            if (!document.querySelectorAll('.onp-sl-content').length && !document.querySelectorAll('[data-lock-id]').length && !document.querySelectorAll('[data-locker-id]').length) return;
            if (document.getElementById('anti_social_locker') !== null) return;

            var css = '.onp-sl-content,[data-lock-id],[data-locker-id]{display:block!important}.onp-sl,.onp-sl-transparence-mode,.onp-sl-overlap-box,[id^="content-locker"]{display:none!important}.onp-sl-blur-area{filter:none!important}',
                head = document.head || document.getElementsByTagName('head')[0],
                style = document.createElement('style');

            style.id = 'anti_social_locker';
            style.appendChild(document.createTextNode(css));

            head.appendChild(style);
        })();


        if (!('jQuery' in global)) return;

        var unlocked = 'Unlocked by Anti Social Locker',
            counter = 0,
            debug = false,
            showCounter = function () {
                if (debug) global.console.log(counter, 'Social Locker have been disabled!');
            },
            setCookie = function (cname, cvalue, exdays, path) {
                var domain = '',
                    d = new Date();

                if (exdays) {
                    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                    exdays = '; expires=' + d.toUTCString();
                }
                if (!path) path = '/';
                document.cookie = cname + '=' + cvalue + '; path=' + path + exdays + domain + ';';
            },
            getCookie = function (name) {
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
            };

        // Social Locker for jQuery (https://codecanyon.net/item/social-locker-for-jquery/3408941)
        (function ($) {
            if ($.fn.sociallocker) jQuery.fn.sociallocker = function () {
                var $lock = $(this.selector);
                $lock.show().attr('data-lock-id', unlocked);

                counter += $lock.length;
                showCounter();

                return this;
            };
        })(jQuery);

        // Easy Social Locker (https://codecanyon.net/item/easy-social-locker/6190651)
        (function ($) {
            var $events = $._data(document, 'events'),
                $doc = $(document),
                str,
                cid;

            if ($events && $events.esll_button_action) {
                $('script:not([src])').each(function () {
                    var txt = this.textContent;

                    if (txt.indexOf('esll_data') !== -1 && txt.indexOf('esll_button_action') !== -1) {
                        str = txt;
                        return false;
                    }
                });

                if (str) cid = str.match(/var\scid\s?=\s?(\d+)\;/);

                if (cid) {
                    cid = cid[1];
                } else {
                    cid = str.match(/\['(google|linkedin)(-share)?'\,\s?(\d+)\]/);

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

                counter += $('.esll-big, .esll-small').length;
                showCounter();
            }
        })(jQuery);

        // ARSocial - Social Share & Social Locker (https://codecanyon.net/item/arsocial-social-share-social-locker/15218913)
        (function ($) {
            var $pageId = $('#ars_page_id'),
                $lockId = $('#ars_locker_id'),
                $lockContents = $('.arsocialshare_locker_main_wrapper'),
                removeClass = 'ars_locked_full ars_locked_transparency ars_locked_blurring';

            if ($pageId.length && $lockId.length && $lockContents.length) {
                $lockContents.each(function () {
                    var $this = $(this),
                        $hidden = $('#' + $this.data('hidden-el'));

                    $hidden.attr('data-lock-id', unlocked).removeClass(removeClass).show();
                    $this.replaceWith($hidden);
                });

                counter += $lockContents.length;
                showCounter();
            }
        })(jQuery);

        // Social Share & Locker Pro Wordpress Plugin (http://codecanyon.net/item/social-share-locker-pro-wordpress-plugin/8137709)
        (function ($) {
            if (!('ism_general_locker' in global)) return;
            var $locker = $('.ism-before-row');

            if ($locker.length) {
                $locker.each(function () {
                    var $this = $(this),
                        $lockerAlert,
                        $lockerContent;

                    (function reUnlock() {
                        $lockerAlert = $('#' + $this.data('lockerid'));
                        $lockerContent = $('#' + $this.data('id'));
                        if (!$lockerAlert.length && !$lockerContent.is('[style]')) return;

                        $lockerContent.attr('data-lock-id', unlocked).removeAttr('style');
                        $lockerContent.parent('.ismLockerWrap').removeAttr('style');
                        $lockerAlert.remove();

                        setTimeout(function () {
                            reUnlock();
                        }, 500);
                    })();
                });

                counter += $locker.length;
                showCounter();
            }
        })(jQuery);

        // Viral Lock - Like, Google+1 or Tweet to Unlock (http://codecanyon.net/item/viral-lock-like-google1-or-tweet-to-unlock/1486602)
        // Viral Lock PHP - Like, Google+1 or Tweet to Unlock (http://codecanyon.net/item/viral-lock-php-like-google1-or-tweet-to-unlock/1632879)
        // Viral Coupon - Like, Tweet or G+ to get a Discount (http://codecanyon.net/item/viral-coupon-like-tweet-or-g-to-get-a-discount/2233568)
        (function ($) {
            if (!('virallocker_use' in global)) return;
            var $locked = $('.virallock-box, .virallocker-box, .virallocker-box-checkout'),
                host = global.location.host,
                str = '',
                pid,
                viralLock = /var\sdata\s?=\s?\{post\:\s?"(\d+)"\,\s?action\:/m,
                viralPHP = /"virallocker"\,\s?myID:\s?"(myid\d+)"\}/m,
                viralCoupon = /var\sdata\s?=\s?{\s?action\:\s?"submit"\,\s?myID\:\s?"(\d+)"\}\;/m,
                afterUnlock = function () {
                    counter += $locked.length;
                    showCounter();
                    global.location.reload();
                },
                viralCookie;

            $('script:not([src])').each(function () {
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
                if ('virallocker_plusone' in global) virallocker_plusone({
                    state: 'on'
                });

                counter += $locked.length;
                showCounter();

            }
        })(jQuery);

    }

    document.addEventListener('DOMContentLoaded', function () {
        antiSocialLocker();
        setTimeout(antiSocialLocker, 4000);

    });

    window.addEventListener('load', function () {
        antiSocialLocker();
        setTimeout(antiSocialLocker, 0);
    });

})(window);
