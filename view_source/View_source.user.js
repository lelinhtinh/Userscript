// ==UserScript==
// @name         viewsource
// @namespace    devs.forumvi.com
// @description  Viewsource for Firefox, like Chrome
// @version      2.3.3
// @icon         http://i.imgur.com/6yZMOeH.png
// @author       Zzbaivong
// @match        *
// @resource     light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.3.0/styles/github-gist.min.css
// @resource     dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.3.0/styles/monokai-sublime.min.css
// @require      https://openuserjs.org/src/libs/baivong/beautify-html.js
// @require      https://openuserjs.org/src/libs/baivong/beautify-js.min.js
// @require      https://openuserjs.org/src/libs/baivong/beautify-css.min.js
// @require      https://openuserjs.org/src/libs/baivong/highlight-xml.js
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {

    'use strict';

    var theme = 'light', // light|dark

        win = window,
        urlpage = win.top.location.href,
        doc = document,
        wrapcontent = doc.documentElement,
        content = doc.body;

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

    function removeEvents(ele, attr) {
        var events = 'onafterprint onbeforeprint onbeforeunload onerror onhashchange onload onmessage onoffline ononline onpagehide onpageshow onpopstate onresize  onstorage onunload onblur onchange oncontextmenu onfocus oninput oninvalid onreset onsearch onselect onsubmit onkeydown onkeypress onkeyup onclick ondblclick ondrag ondragend ondragenter ondragleave ondragover ondragstart ondrop onmousedown onmousemove onmouseout onmouseover onmouseup onmousewheel onscroll onwheel oncopy oncut onpaste onerror onshow ontoggle'.split(' '),
            x;
        for (x in events) {
            var _event = events[x];
            ele[_event] = null;
            if (attr) {
                ele.removeAttribute(_event);
            }
        }
    }

    function viewsource() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: urlpage,
            onload: function (response) {

                removeEvents(win);
                removeEvents(doc);
                removeEvents(wrapcontent, true);
                removeEvents(content, true);

                var txt = html_beautify(response.response);

                doc.head.innerHTML = '';
                content.innerHTML = '';
                content.removeAttribute('id');
                content.removeAttribute('class');
                content.removeAttribute('style');
                doc.title = 'view-source:' + urlpage;

                GM_addStyle(GM_getResourceText(theme) + 'html,body,pre{margin:0;padding:0}.hljs{overflow:hidden;word-wrap:normal!important;white-space:pre!important;padding-left:4em;line-height:100%}.hljs::before{content:attr(data-lines);position:absolute;color:#d2d2d2;text-align:right;width:3.5em;left:-.5em;border-right:1px solid rgba(221, 221, 221, 0.36);padding-right:.5em}');

                var output = doc.createElement('PRE');
                output.setAttribute('class', 'xml');
                output.textContent = txt;

                content.appendChild(output);

                hljs.highlightBlock(output);

                var lines = txt.split('\n'),
                    l = '';
                lines = lines ? lines.length : 0;
                for (var i = 0; i < lines; i++) {
                    l += (i + 1) + '\n';
                }

                output.setAttribute('data-lines', l);
                //output.style.width = output.scrollWidth + 'px';

                scrollByDragging(output, false, true);
                scrollByDragging(content, true);
                scrollByDragging(wrapcontent, true);

                var attrUrl = doc.getElementsByClassName('hljs-attr');
                for (var j = 0; j < attrUrl.length; j++) {
                    if (/\b(src|href\b)/.test(attrUrl[j].textContent)) {
                        var link = attrUrl[j].nextSibling.nextSibling;
                        var url = link.textContent.slice(1, -1);
                        link.innerHTML = '<a href="' + url + '" target="_blank">' + url + '</a>';
                    }
                }

            }
        });
    }

    GM_registerMenuCommand('View source', viewsource, 'm');

    if (doc.contentType === 'text/html' && doc.URL === urlpage) {
        win.onkeydown = function (e) {

            // Ctrl + M
            if (e.which === 77 && e.ctrlKey) {
                e.preventDefault();

                viewsource();
            }
        };
    }
}());
