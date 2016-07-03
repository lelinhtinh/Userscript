// ==UserScript==
// @name         popup blocker
// @namespace    http://baivong.github.io/
// @description  Block all javascript popup and link has click event. Double click to open link blocked.
// @version      1.3.0
// @icon         http://i.imgur.com/yUHcAyG.png
// @author       Zzbaivong
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-start
// @grant        none
// ==/UserScript==


var popupBlockerConfigs = {
    allow: 'google.com|google.com.vn|facebook.com|twitter.com|github.com|youtube.com|imgur.com|messenger.com|openuserjs.org|greasyfork.org|worldcosplay.net', // Domain
    popup: false, // true|false
    click: false // true|false
};



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
        allow: popupBlockerConfigs.allow.split('|'),
        host: global.location.host,
        allowSite: false,
        testHost: function (hostMatch, hostTest) {
            var matchHost = new RegExp('^([\\w\\.\\-]+\\.)?' + hostMatch.replace(/\./g, '\\.') + '$');
            return matchHost.test(hostTest);
        },
        checkSite: function () {
            var list = this.allow,
                listSize = list.length;

            if (!listSize) return;

            for (var i = 0; i < listSize; i++) {
                if (this.testHost(list[i], this.host)) {
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
                            if (blocker.testHost(blocker.host, ele.host)) return;

                            $this.attr('data-selector', 'popupblocker' + i);
                            dataSelector = 'a[data-selector="popupblocker' + i + '"]';
                            if ($.fn.on) {
                                $doc.on('click', dataSelector, hanler).on('dblclick', dataSelector, dbhanler).data('popupblocker', true);
                            } else {
                                $(dataSelector).live('click', hanler).live('dblclick', dbhanler).attr('data-popupblocker', true);
                            }
                        });
                    });
                });
            }

            for (var i = 0; i < allLinksSize; i++) {
                var link = allLinks[i];

                if (!this.testHost(this.host, link.host) && !link.dataset.popupblocker && (link.onclick || (link.eventListenerList && link.eventListenerList.click))) {
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

        global._open = global.open;

        if (!popupBlockerConfigs.popup) global.open = function (url, target, params) {
            popupBlocker.userscript.counter++;
            popupBlocker.userscript.warns(url + '\n' + target + '\n' + params);
            return false;
        };

        if (popupBlockerConfigs.click) return;
        var oldXHR = global.XMLHttpRequest;

        function newXHR() {
            var realXHR = new oldXHR();
            realXHR.addEventListener('readystatechange', function () {
                popupBlocker.userscript.init();
            }, false);
            return realXHR;
        }
        global.XMLHttpRequest = newXHR;

        popupBlocker.userscript.init();

    });

})(window);
