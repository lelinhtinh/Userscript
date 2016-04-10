// ==UserScript==
// @id           image-viewer@devs.forumvi.com
// @name         Image viewer
// @namespace    http://devs.forumvi.com/
// @description  Use grid wallpaper to highlight transparent image. Support to see the large image by holding the right mouse and drag.
// @version      1.0.5
// @icon         http://i.imgur.com/ItcjCPc.png
// @author       Zzbaivong
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {

    'use strict';

    var theme = 'light', // dark|light

        url,
        doc = document;

    if (theme === 'light') {
        url = 'data:image/gif;base64,R0lGODlhCgAKAIAAAAAAAP///yH5BAEAAAAALAAAAAAKAAoAAAIRhB2ZhxoM3GMSykqd1VltzxQAOw==';
    } else {
        url = 'data:image/gif;base64,R0lGODlhCgAKAPAAACIiIgAAACH5BAHoAwEALAAAAAAKAAoAAAIRjA2Zhwoc3GMSykqd1VltzxQAOw==';
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

        GM_addStyle('body{background:url(' + url + ') repeat scroll rgba(0, 0, 0, 0.3);} body > img {background-color: transparent !important; display: block; margin: auto; position: absolute; left: 0; top: 0; right: 0; bottom: 0;} body > img:hover {background: rgba(0, 0, 0, 0.4) !important; outline: 3px solid #333;} body > img[style*="cursor: zoom-out;"], body > img.overflowing {position: relative!important;}');

        scrollByDragging(doc.body);
        scrollByDragging(doc.documentElement);

    }

}());
