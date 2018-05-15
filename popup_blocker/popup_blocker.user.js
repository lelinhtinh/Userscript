// ==UserScript==
// @name         popup blocker
// @namespace    http://baivong.github.io/
// @description  Block all javascript popup and link has click event. Double click to open link blocked.
// @version      2.2.0
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
        //               false: Disable block script links

        strict: false, // true : Block all script links
        //                false: Block all script links, but ignore detect
        //                      javascript event on dynamic element

        mode: 'block', // 'block': Only block script links on sites in the list below
        //                'allow': Block script links on all sites, but ignore
        //                         sites in this list below

        list: 'fiddle.jshell.net|jsfiddle.net'
            // list of domain names of sites
    },

    popUp: { // Popup windows

        active: true, // true : Block popup
        //               false: Disable block popup

        strict: false, // true : Block all popups
        //                false: Block all popups, but ignore blank url
        //                       and internal url.

        mode: 'allow', // 'block': Only block popup on sites in the list below
        //                'allow': Block popup on all sites, but ignore
        //                         sites in this list below

        list: 'google.com|google.com.vn|facebook.com|twitter.com|github.com|youtube.com|imgur.com|messenger.com|openuserjs.org|greasyfork.org|worldcosplay.net|devs.forumvi.com'
            // list of domain names of sites
    },

    showLog: false // for debug

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
        blockPopup: function () {
            var blocker = zZpopupBlocker.userscript;

            global._open = global.open;

            global.open = function (url, target, params) {
                if (!zZpopupBlockerRulers.popUp.strict) {
                    var getHost = url.match(/^https?:\/\/([^\/]+)\//);
                    if (getHost && blocker.testHost(blocker.host, getHost[1])) return;

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
                var blocker = zZpopupBlocker.userscript,

                    hanler = function (event) {
                        event.preventDefault();

                        blocker.counter++;
                        blocker.warns(this.href + '\n' + this.target + '\nClick');
                    },
                    dbhanler = function (event) {
                        event.preventDefault();

                        global._open(this.href, '_blank');
                    };

                document.addEventListener('mouseover', function () {
                    var _this = (this === document) ? event.target : this;

                    if (_this.tagName !== 'A') return;
                    if (typeof _this.dataset.popupBlocker !== 'undefined') return;

                    if (/^https?:$/i.test(_this.protocol) && !blocker.testHost(blocker.host, _this.host) && (_this.onclick || (_this.eventListenerList && _this.eventListenerList.click))) {
                        _this.dataset.popupBlocker = 'true';
                        _this.addEventListener('click', hanler, false);
                        _this.addEventListener('dblclick', dbhanler, false);
                    } else {
                        _this.dataset.popupBlocker = 'false';
                    }
                });


                if (!zZpopupBlockerRulers.scriptLink.strict) return;

                if (document.onclick) document.onclick = null;
                if (document.documentElement.onclick) document.documentElement.onclick = null;
                if (document.body.onclick) document.body.onclick = null;

                if (typeof global.jQuery === 'undefined') return;
                global.jQuery(function ($) {
                    var $doc = $(document),
                        $event = $doc.data('events') || $._data(document, 'events');

                    if ($event && $event.click) $.each($event.click, function () {
                        var _this = this.selector;
                        if (!_this) return;

                        if ($.fn.on) {
                            $doc.on('click', _this, hanler).on('dblclick', _this, dbhanler);
                        } else {
                            $(_this).live('click', hanler).live('dblclick', dbhanler);
                        }
                    });
                });
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
