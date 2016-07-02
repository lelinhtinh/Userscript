// ==UserScript==
// @name         popup blocker
// @namespace    http://baivong.github.io/
// @description  Block all javascript popup
// @version      0.9.1
// @icon         http://i.imgur.com/yUHcAyG.png
// @author       Zzbaivong
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-start
// @grant        none
// ==/UserScript==


var allowPopupConfigs = 'google.com|google.com.vn|facebook.com|twitter.com|github.com|youtube.com|imgur.com|messenger.com';



(function (global) {
    'use strict';

    allowPopupConfigs = allowPopupConfigs.split('|');
    var allowPopupConfigsSize = allowPopupConfigs.length,
        allowPopup = false,
        host = global.location.host,
        matchHost;

    if (allowPopupConfigsSize)
        for (var i = 0; i < allowPopupConfigsSize; i++) {
            matchHost = new RegExp('^([\\w\\.\\-]+\\.)?' + allowPopupConfigs[i].replace(/\./g, '\\.') + '$');
            if (matchHost.test(host)) {
                allowPopup = true;
                break;
            }
        }

    function logs(str) {
        if (global.console) global.console.log(str, host);
    }

    if (allowPopup) {
        logs('Popup blocker is disabled!');
        return;
    } else {
        logs('Popup blocker is running!');
    }


    global.Element.prototype._addEventListener = global.Element.prototype.addEventListener;
    global.Element.prototype.addEventListener = function (a, b, c) {
        this._addEventListener(a, b, c);
        if (!this.eventListenerList) this.eventListenerList = {};
        if (!this.eventListenerList[a]) this.eventListenerList[a] = [];
        this.eventListenerList[a].push(b);
    };

    var popupBlockerCounter = 0;
    global.open = function (a, b, c) {
        popupBlockerCounter++;
        if (global.console) global.console.warn(popupBlockerCounter, 'popups blocked\n' + a + '\n' + b + '\n' + c);
        return false;
    };

    function preventDefaultClick() {
        var allLinkElements = document.getElementsByTagName('a'),
            allLinkElementsSize = allLinkElements.length,
            hanler = function (event) {
                event.preventDefault();
                popupBlockerCounter++;
                if (global.console) global.console.warn(popupBlockerCounter, 'popups blocked\n' + this.href + '\n' + this.target + '\nClick');
            };

        if (!allLinkElementsSize) return;

        if (typeof global.jQuery !== 'undefined') {
            var $ = global.jQuery,
                $doc = $(document),
                $event = $doc.data('events') || $._data(document, 'events');
            if (!$doc.data('popupblocker') && $event && $event.click) $.each($event.click, function () {
                $doc.on('click', this.selector, hanler).data('popupblocker', true);
            });
        }

        for (var i = 0; i < allLinkElementsSize; i++) {
            var link = allLinkElements[i];
            if (!link.dataset.popupblocker && (link.onclick || (typeof global.jQuery !== 'undefined' && global.jQuery(link).data('events') && global.jQuery(link).data('events').click) || (typeof global.jQuery !== 'undefined' && global.jQuery._data(link, 'events') && global.jQuery._data(link, 'events').click) || (link.eventListenerList && link.eventListenerList.click))) link.addEventListener('click', hanler, false);
            link.dataset.popupblocker = true;
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (('Discourse' in global)) {
            logs('Popup blocker is disabled on Discourse.');
            return;
        }

        preventDefaultClick();

        var oldXHR = global.XMLHttpRequest;
        function newXHR() {
            var realXHR = new oldXHR();
            realXHR.addEventListener('readystatechange', function () {
                preventDefaultClick();
            }, false);
            return realXHR;
        }
        global.XMLHttpRequest = newXHR;
    });

})(window);
