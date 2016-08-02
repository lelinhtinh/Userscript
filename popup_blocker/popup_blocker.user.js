// ==UserScript==
// @name         popup blocker
// @namespace    http://baivong.github.io/
// @description  Block all javascript popup and link has click event. Double click to open link blocked.
// @version      2.1.0
// @icon         http://i.imgur.com/yUHcAyG.png
// @author       Zzbaivong
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-start
// @grant        none
// ==/UserScript==


var zZpopupBlockerRulers = {

    scriptLink: { // script links are meant links have javascript event listeners/handlers

        active: true, // true : Block script links
        // false: Disable block script links

        mode: 'block', // 'block': Only block script links on sites in the list below
        // 'allow': Block script links on all sites, but ignore
        //          sites in this list below

        strict: true, // true : Block all script links
        // false: Block all script links, but ignore detect
        //        javascript event on dynamic element

        list: 'fiddle.jshell.net|jsfiddle.net'
            // list of domain names of sites
    },

    popUp: { // Popup windows

        active: true, // true : Block popup
        // false: Disable block popup

        mode: 'allow', // 'block': Only block popup on sites in the list below
        // 'allow': Block popup on all sites, but ignore
        //          sites in this list below

        strict: false, // true : Block all popups
        // false: Block all popups, but ignore blank url
        //        and internal url.

        list: 'google.com|google.com.vn|facebook.com|twitter.com|github.com|youtube.com|imgur.com|messenger.com|openuserjs.org|greasyfork.org|worldcosplay.net|devs.forumvi.com'
            // list of domain names of sites
    },

    showLog: true // for debug

};


(function (global, document) {
    'use strict';

    global.Element.prototype._addEventListener = global.Element.prototype.addEventListener;
    global.Element.prototype.addEventListener = function (a, b, c) {
        this._addEventListener(a, b, c);
        if (!this.eventListenerList) this.eventListenerList = {};
        if (!this.eventListenerList[a]) this.eventListenerList[a] = [];
        this.eventListenerList[a].push(b);
    };

    var zZpopupBlocker = {};
    zZpopupBlocker.userscript = {
        sites: {
            scriptLink: zZpopupBlockerRulers.scriptLink.list.split('|'),
            popUp: zZpopupBlockerRulers.popUp.list.split('|')
        },
        host: global.self.location.host,
        testHost: function (hostMatch, hostTest) {
            var matchHost = new RegExp('^([\\w\\.\\-]+\\.)?' + hostMatch.replace(/\./g, '\\.') + '$');
            return matchHost.test(hostTest);
        },
        checkSite: function (type) {
            var list = this.sites[type],
                listSize = list.length,
                siteInList = false,
                blocking = false;

            if (!listSize) {
                if (zZpopupBlockerRulers[type].mode === 'allow') {
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
                if (zZpopupBlockerRulers[type].mode === 'allow') {
                    blocking = false;
                } else {
                    blocking = true;
                }
            } else {
                if (zZpopupBlockerRulers[type].mode === 'allow') {
                    blocking = true;
                } else {
                    blocking = false;
                }
            }

            return blocking;
        },
        logs: function (str) {
            if (zZpopupBlockerRulers.showLog && global.console) global.console.log(str, this.host);
        },
        counter: 0,
        warns: function (str) {
            if (zZpopupBlockerRulers.showLog && global.console) global.console.warn(this.counter, 'popups blocked\n' + str);
        },
        testLink: function () {
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

            if (zZpopupBlockerRulers.scriptLink.strict) {
                if (document.onclick) {
                    //
                }

                if (document.eventListenerList && document.eventListenerList.click) {
                    //
                }

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
                                if (typeof $doc.attr('data-jQpopupBlocker') !== 'undefined') return;

                                if (!blocker.testHost(blocker.host, ele.host) && /^https?:$/i.test(ele.protocol)) {
                                    $this.attr('data-selector', 'jQpopupBlocker' + i);
                                    dataSelector = 'a[data-selector="jQpopupBlocker' + i + '"]';
                                    if ($.fn.on) {
                                        $doc.on('click', dataSelector, hanler).on('dblclick', dataSelector, dbhanler);
                                    } else {
                                        $(dataSelector).live('click', hanler).live('dblclick', dbhanler);
                                    }
                                    $this.attr('data-jQpopupBlocker', true);
                                } else {
                                    $this.attr('data-jQpopupBlocker', false);
                                }
                            });
                        });
                    });
                }
            }

            for (var i = 0; i < allLinksSize; i++) {
                var link = allLinks[i];
                /*jshint scripturl:true*/
                if (typeof link.dataset.popupBlocker === 'undefined' && /^https?:$/i.test(link.protocol) && !this.testHost(this.host, link.host) && (link.onclick || (link.eventListenerList && link.eventListenerList.click))) {
                    link.dataset.popupBlocker = 'true';
                    link.addEventListener('click', hanler, false);
                    link.addEventListener('dblclick', dbhanler, false);
                } else {
                    link.dataset.popupBlocker = 'false';
                }
            }
        },
        blockPopup: function () {
            var blocker = zZpopupBlocker.userscript;

            global._open = global.open;

            global.open = function (url, target, params) {
                if (!zZpopupBlockerRulers.popUp.strict && (!url || blocker.testHost(blocker.host, url.match(/^https?:\/\/([^\/]+)\//)[1]))) {
                    if (!url) url = '';

                    return global._open(url, target, params);
                } else {
                    blocker.counter++;
                    blocker.warns(url + '\n' + target + '\n' + params);

                    return false;
                }
            };
        },
        blockScript: function () {
            document.addEventListener('DOMContentLoaded', function () {
                var blocker = zZpopupBlocker.userscript;

                if (('Discourse' in global)) {
                    blocker.logs('Script links blocker ignore Discourse.');
                    return;
                }

                var oldXHR = global.XMLHttpRequest;

                function newXHR() {
                    var realXHR = new oldXHR();
                    realXHR.addEventListener('readystatechange', function () {
                        blocker.testLink();
                    }, false);
                    return realXHR;
                }
                global.XMLHttpRequest = newXHR;

                blocker.testLink();
            });
        }
    };

    if (zZpopupBlocker.userscript.checkSite('popUp') && zZpopupBlockerRulers.popUp.active) {
        zZpopupBlocker.userscript.blockPopup();
        zZpopupBlocker.userscript.logs('Popup blocker is running.');
    } else {
        zZpopupBlocker.userscript.logs('Popup blocker is disabled.');
    }

    if (zZpopupBlocker.userscript.checkSite('scriptLink') && zZpopupBlockerRulers.scriptLink.active) {
        zZpopupBlocker.userscript.blockScript();
        zZpopupBlocker.userscript.logs('Script links blocker is running.');
    } else {
        zZpopupBlocker.userscript.logs('Script links blocker is disabled.');
    }

})(window, document);

