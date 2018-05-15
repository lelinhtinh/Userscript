// ==UserScript==
// @name         Image viewer
// @namespace    http://devs.forumvi.com/
// @description  Use grid wallpaper to highlight transparent image. Support to view the large image by holding the right mouse and drag.
// @version      2.0.1
// @icon         http://i.imgur.com/ItcjCPc.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://*/*
// @match        https://*/*
// @noframes
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {

    'use strict';

    /**
     * Background mode
     * @type {string} dark
     *                light
     */
    var theme = 'dark',


        color,
        doc = document;

    if (theme === 'light') {
        color = ['#eee', 'white'];
    } else {
        color = ['gray', '#444'];
    }

    function scrollByDragging(container, disableH, disableV) {

        function mouseUp(e) {
            if (e.which !== 3) return;

            window.removeEventListener('mousemove', mouseMove, true);
            container.style.cursor = 'default';
        }

        function mouseDown(e) {
            if (e.which !== 3) return;

            pos = {
                x: e.clientX,
                y: e.clientY
            };

            window.addEventListener('mousemove', mouseMove, true);
            container.style.cursor = 'move';
        }

        function mouseMove(e) {
            if (!disableH) container.scrollLeft -= (-pos.x + (pos.x = e.clientX));
            if (!disableV) container.scrollTop -= (-pos.y + (pos.y = e.clientY));
        }

        var pos = {
            x: 0,
            y: 0
        };

        container.oncontextmenu = function (e) {
            e.preventDefault();
        };

        container.addEventListener('mousedown', mouseDown, false);
        window.addEventListener('mouseup', mouseUp, false);

    }

    if (document.contentType.indexOf('image/') === 0) {

        GM_addStyle('body{background-attachment: fixed !important; background-position: 0px 0px, 10px 10px !important; background-size: 20px 20px !important; background-image: linear-gradient(45deg, ' + color[0] + ' 25%, transparent 25%, transparent 75%, ' + color[0] + ' 75%, ' + color[0] + ' 100%),linear-gradient(45deg, ' + color[0] + ' 25%, ' + color[1] + ' 25%, ' + color[1] + ' 75%, ' + color[0] + ' 75%, ' + color[0] + ' 100%) !important;} body > img {background-color: transparent !important; background-image: none !important; display: block; margin: auto; position: absolute; left: 0; top: 0; right: 0; bottom: 0;} body > img:hover {background: rgba(0, 0, 0, 0.4) !important; outline: 3px solid #333;} body > img[style*="cursor: zoom-out;"], body > img.overflowing {position: relative !important;}');

        scrollByDragging(doc.body);
        scrollByDragging(doc.documentElement);

    }

}());
