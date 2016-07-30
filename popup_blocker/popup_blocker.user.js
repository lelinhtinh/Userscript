// ==UserScript==
// @name         popup blocker
// @namespace    http://baivong.github.io/
// @description  Block all javascript popup and link has click event. Double click to open link blocked.
// @version      2.0.1
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
    sites: 'google.com|google.com.vn|facebook.com|twitter.com|github.com|youtube.com|imgur.com|messenger.com|openuserjs.org|greasyfork.org|worldcosplay.net', // Domain
    mode: 'allow', // allow|block
    popup: false, // true|false
    link: false // true|false
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
        sites: popupBlockerConfigs.sites.split('|'),
        host: global.self.location.host,
        testHost: function (hostMatch, hostTest) {
            var matchHost = new RegExp('^([\\w\\.\\-]+\\.)?' + hostMatch.replace(/\./g, '\\.') + '$');
            return matchHost.test(hostTest);
        },
        checkSite: function () {
            var list = this.sites,
                listSize = list.length,
                siteInList = false,
                blocking = false;

            if (!listSize) {
                if (popupBlockerConfigs.mode === 'allow') {
                    return true;
                } else {
                    return false;
                }
            }

            for (var i = 0; i < listSize; i++) {
                if (this.testHost(list[i], this.host)) {
                    siteInList = true;
                    break;
                }
            }

            if (siteInList) {
                if (popupBlockerConfigs.mode === 'allow') {
                    blocking = false;
                } else {
                    blocking = true;
                }
            } else {
                if (popupBlockerConfigs.mode === 'allow') {
                    blocking = true;
                } else {
                    blocking = false;
                }
            }

            return blocking;
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

                    if ($event && $event.click) $.each($event.click, function () {
                        var _this = this.selector;

                        if (_this) $(_this).each(function (i, ele) {
                            var $this = $(ele),
                                dataSelector;
                            if ($this[0].tagName !== 'A') return;
                            if (typeof $doc.attr('data-jqpopupblocker') !== 'undefined') return;
                            if (!blocker.testHost(blocker.host, ele.host) && /^https?:$/i.test(ele.protocol)) {
                                $this.attr('data-selector', 'popupblocker' + i);
                                dataSelector = 'a[data-selector="popupblocker' + i + '"]';
                                if ($.fn.on) {
                                    $doc.on('click', dataSelector, hanler).on('dblclick', dataSelector, dbhanler);
                                } else {
                                    $(dataSelector).live('click', hanler).live('dblclick', dbhanler);
                                }
                                $this.attr('data-jqpopupblocker', true);
                            } else {
                                $this.attr('data-jqpopupblocker', false);
                            }
                        });
                    });
                });
            }

            for (var i = 0; i < allLinksSize; i++) {
                var link = allLinks[i];
                /*jshint scripturl:true*/
                if (typeof link.dataset.popupblocker === 'undefined' && /^https?:$/i.test(link.protocol) && !this.testHost(this.host, link.host) && (link.onclick || (link.eventListenerList && link.eventListenerList.click))) {
                    link.dataset.jspopupblocker = 'true';
                    link.addEventListener('click', hanler, false);
                    link.addEventListener('dblclick', dbhanler, false);
                } else {
                    link.dataset.jspopupblocker = 'false';
                }
            }
        }
    };

    if (popupBlocker.userscript.checkSite()) {
        popupBlocker.userscript.logs('Popup blocker is running.');
    } else {
        popupBlocker.userscript.logs('Popup blocker is disabled.');
        return;
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

        if (popupBlockerConfigs.link) return;
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
