// ==UserScript==
// @name         Javascript-css beautify
// @namespace    http://devs.forumvi.com
// @description  Beautify and syntax highlighting for source code javascript, json, css. Support to view the source code by holding the right mouse and drag.
// @version      2.5.0
// @icon         http://i.imgur.com/kz8nqz1.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://*/*
// @match        https://*/*
// @resource     light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/tomorrow.min.css
// @resource     dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/tomorrow-night.min.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-css.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM.getResourceUrl
// ==/UserScript==

/* global css_beautify, js_beautify, hljs */
(function () {

    'use strict';

    var theme = 'dark', // light|dark
        lineColor = {
            light: ['#a7a7a7', '#e8e8e7'],
            dark: ['#4d4d4d', '#3a3a3a']
        },
        bgColor = {
            light: '#ffffff',
            dark: '#1d1f21'
        },

        url = location.pathname,
        doc = document,
        contenttype = doc.contentType;

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

    if (/^application\/(x-javascript|javascript|json)|text\/css$/.test(contenttype) || (/.+\.(js|json|css)$/.test(url) && !/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(contenttype))) {

        var output = doc.getElementsByTagName('pre')[0],
            txt = output.textContent,
            lang = 'javascript',
            lines = 0,
            l = '';

        GM_getResourceText(theme).then(function (res) {
            GM_addStyle(res + 'html,body,pre{margin:0;padding:0;background:' + bgColor[theme] + '}.hljs{word-wrap:normal!important;white-space:pre!important;padding-left:4em;line-height:100%}.hljs::before{content:attr(data-lines);position:absolute;color:' + lineColor[theme][0] + ';text-align:right;width:3.5em;left:-.5em;border-right:1px solid ' + lineColor[theme][1] + ';padding-right:.5em}');
        });

        if (contenttype === 'text/css' || /.+\.css$/.test(url)) {
            lang = 'css';
            txt = css_beautify(txt);
        } else {
            txt = js_beautify(txt);
        }

        output.textContent = txt;
        output.setAttribute('class', lang);

        hljs.highlightBlock(output);

        lines = txt.split('\n');
        lines = lines ? lines.length : 0;
        for (var i = 0; i < lines; i++) {
            l += (i + 1) + '\n';
        }

        output.setAttribute('data-lines', l);
        output.style.width = output.scrollWidth + 'px';

        scrollByDragging(doc.body);
        scrollByDragging(doc.documentElement);

    }

}());
