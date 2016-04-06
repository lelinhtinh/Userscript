// ==UserScript==
// @name         Javascript-css beautify
// @namespace    http://devs.forumvi.com
// @description  Beautify and syntax highlight javascript/css source code
// @version      2.3.3
// @icon         http://i.imgur.com/kz8nqz1.png
// @author       Zzbaivong
// @match        *
// @resource     light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.3.0/styles/github-gist.min.css
// @resource     dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.3.0/styles/monokai-sublime.min.css
// @require      https://greasyfork.org/scripts/18531-beautify-js/code/beautify-js.js?version=117786
// @require      https://greasyfork.org/scripts/18528-beautify-css/code/beautify-css.js?version=117789
// @require      https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.3.0/highlight.min.js
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function () {

    'use strict';

    var theme = 'light', // light|dark

        url = window.top.location.pathname,
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

    if (/^(application\/x-javascript|application\/javascript|application\/json|text\/css)$/.test(contenttype) || /.+\.(js|json|css)$/.test(url)) {

        var output = doc.getElementsByTagName('pre')[0],
            txt = output.textContent,
            lang = 'javascript',
            lines = 0,
            l = '';

        GM_addStyle(GM_getResourceText(theme) + 'html,body,pre{margin:0;padding:0}.hljs{overflow:hidden;word-wrap:normal!important;white-space:pre!important;padding-left:4em;line-height:100%}.hljs::before{content:attr(data-lines);position:absolute;color:#d2d2d2;text-align:right;width:3.5em;left:-.5em;border-right:1px solid rgba(221, 221, 221, 0.36);padding-right:.5em}');

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
        //output.style.width = output.scrollWidth + 'px';

        scrollByDragging(output, false, true);
        scrollByDragging(doc.body, true);
        scrollByDragging(doc.documentElement, true);

    }

}());
