// ==UserScript==
// @name         viewsource
// @namespace    devs.forumvi.com
// @description  View and beauty website source code. Support to view the source code by holding the right mouse and drag. Shortcut: Alt+U.
// @version      2.6.2
// @icon         http://i.imgur.com/6yZMOeH.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://*/*
// @match        https://*/*
// @resource     light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/tomorrow.min.css
// @resource     dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/tomorrow-night.min.css
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-html.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-css.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect      self
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM.getResourceUrl
// @grant        GM_getResourceURL
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

/* global html_beautify, hljs */
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
        linkColor = {
            light: ['#718c00', '#556416'],
            dark: ['#b5bd68', '#8b9433']
        },

        win = window,
        urlpage = location.href,
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
        GM.xmlHttpRequest({
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

                GM_getResourceText(theme).then(function (res) {
                    GM_addStyle(res + 'html,body,pre{margin:0;padding:0;background:' + bgColor[theme] + '}.hljs{word-wrap:normal!important;white-space:pre!important;padding-left:4em;line-height:100%}.hljs::before{content:attr(data-lines);position:absolute;color:' + lineColor[theme][0] + ';text-align:right;width:3.5em;left:-.5em;border-right:1px solid ' + lineColor[theme][1] + ';padding-right:.5em}a{color:' + linkColor[theme][0] + '}a:active,a:hover,a:visited{color:' + linkColor[theme][1] + '}');
                });

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
                output.style.width = output.scrollWidth + 'px';

                scrollByDragging(content);
                scrollByDragging(wrapcontent);

                var attrUrl = doc.getElementsByClassName('hljs-attr');
                for (var j = 0; j < attrUrl.length; j++) {
                    if (/\b(src|href\b)/.test(attrUrl[j].textContent)) {
                        var link = attrUrl[j].nextSibling.nextSibling,
                            url = link.textContent,
                            quote = url.slice(0, 1);

                        if (quote !== '\'' && quote !== '"') {
                            quote = '';
                        } else {
                            url = url.slice(1, -1);
                        }

                        link.innerHTML = quote + '<a href="' + url + '" target="_blank">' + url + '</a>' + quote;
                    }
                }

            }
        });
    }

    GM_registerMenuCommand('Beautify Page Source', viewsource, 'u');

    if (/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(doc.contentType)) {
        doc.onkeydown = function (e) {

            // Alt+U
            if (e.which === 85 && e.altKey) {
                e.preventDefault();

                viewsource();
            }
        };
    }

}());
