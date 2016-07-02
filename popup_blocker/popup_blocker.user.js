// ==UserScript==
// @name         popup blocker
// @namespace    http://baivong.github.io/
// @description  Block all javascript popup
// @version      1.1.1
// @icon         http://i.imgur.com/yUHcAyG.png
// @author       Zzbaivong
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-start
// @grant        none
// ==/UserScript==


var popupBlockerAllowSitesConfig = 'google.com|google.com.vn|facebook.com|twitter.com|github.com|youtube.com|imgur.com|messenger.com|openuserjs.org|greasyfork.org';



(function (global) {
    'use strict';

    global.Element.prototype._addEventListener = global.Element.prototype.addEventListener;
    global.Element.prototype.addEventListener = function (a, b, c) {
        this._addEventListener(a, b, c);
        if (!this.eventListenerList) this.eventListenerList = {};
        if (!this.eventListenerList[a]) this.eventListenerList[a] = [];
        this.eventListenerList[a].push(b);
    };

    var popupBlocker = {};
    popupBlocker.userscript = {
        allow: popupBlockerAllowSitesConfig.split('|'),
        host: global.location.host,
        allowSite: false,
        checkSite: function () {
            var list = this.allow,
                listSize = list.length,
                matchHost;

            if (!listSize) return;

            for (var i = 0; i < listSize; i++) {
                matchHost = new RegExp('^([\\w\\.\\-]+\\.)?' + list[i].replace(/\./g, '\\.') + '$');
                if (matchHost.test(this.host)) {
                    this.allowSite = true;
                    break;
                }
            }

            return this.allowSite;
        },
        logs: function (str) {
            if (global.console) global.console.log(str, this.host);
        },
        counter: 0,
        warns: function (str) {
            if (global.console) global.console.warn(this.counter, 'popups blocked\n' + str);
        },
        init: function () {
            var blocker = this,
                allLinks = document.getElementsByTagName('a'),
                allLinksSize = allLinks.length,
                hanler = function (event) {
                    event.preventDefault();
                    var _this = (this === document) ? event.target : this;

                    blocker.counter++;
                    blocker.warns(_this.href + '\n' + _this.target + '\nClick');
                },
                dbhanler = function (event) {
                    event.preventDefault();
                    var _this = (this === document) ? event.target : this;

                    global._open(_this.href, '_blank');
                };

            if (!allLinksSize) return;

            if (typeof global.jQuery !== 'undefined') {
                $(function () {
                    var $ = global.jQuery,
                        $doc = $(document),
                        $event = $doc.data('events') || $._data(document, 'events');

                    if (!$doc.data('popupblocker') && $event && $event.click) $.each($event.click, function () {
                        var _this = this.selector;

                        if (_this) $(_this).each(function (i, ele) {
                            var $this = $(ele),
                                dataSelector;
                            if ($this[0].tagName !== 'A') return;

                            $this.attr('data-selector', 'popupblocker' + i);
                            dataSelector = 'a[data-selector="popupblocker' + i + '"]';
                            if ($.fn.on) {
                                $doc.on('click', dataSelector, hanler).on('dblclick', dataSelector, dbhanler).data('popupblocker', true);
                            } else {
                                $this.live('click', hanler).live('dblclick', dbhanler).attr('data-popupblocker', true);
                            }
                        });
                    });
                });
            }

            for (var i = 0; i < allLinksSize; i++) {
                var link = allLinks[i];

                if (!link.dataset.popupblocker && (link.onclick || (typeof global.jQuery !== 'undefined' && global.jQuery(link).data('events') && global.jQuery(link).data('events').click) || (typeof global.jQuery !== 'undefined' && global.jQuery._data(link, 'events') && global.jQuery._data(link, 'events').click) || (link.eventListenerList && link.eventListenerList.click))) {
                    link.addEventListener('click', hanler, false);
                    link.addEventListener('dblclick', dbhanler, false);
                }

                link.dataset.popupblocker = true;
            }
        }
    };

    if (popupBlocker.userscript.checkSite()) {
        popupBlocker.userscript.logs('Popup blocker is disabled.');
        return;
    } else {
        popupBlocker.userscript.logs('Popup blocker is running.');
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (('Discourse' in global)) {
            popupBlocker.userscript.logs('Popup blocker is disabled on Discourse.');
            return;
        }

        var oldXHR = global.XMLHttpRequest;

        function newXHR() {
            var realXHR = new oldXHR();
            realXHR.addEventListener('readystatechange', function () {
                popupBlocker.userscript.init();
            }, false);
            return realXHR;
        }
        global.XMLHttpRequest = newXHR;

        global._open = global.open;
        global.open = function (url, target, params) {
            popupBlocker.userscript.counter++;
            popupBlocker.userscript.warns(url + '\n' + target + '\n' + params);
            return false;
        };

        popupBlocker.userscript.init();
    });

})(window);
