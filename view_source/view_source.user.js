// ==UserScript==
// @name         viewsource
// @namespace    devs.forumvi.com
// @description  View and beautify page source. Shortcut: Alt+U.
// @version      3.0.0
// @icon         http://i.imgur.com/6yZMOeH.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://*/*
// @match        https://*/*
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect      *
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.openInTab
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==

/* global importScripts */
(function () {
    'use strict';

    var doc = document,
        urlpage = location.href,
        urlbeautify = 'https://lelinhtinh.github.io/Userscript/?beautify-source=';

    if (!/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(doc.contentType)) return;

    if (urlpage.indexOf(urlbeautify) !== 0) {
        var viewsource = function () {
            if (urlpage.indexOf(urlbeautify) === 0) return;
            GM.openInTab(urlbeautify + encodeURIComponent(urlpage), false);
        };

        GM_registerMenuCommand('Beautify Page Source', viewsource, 'u');
        doc.onkeydown = function (e) {
            if (e.which === 85 && e.altKey) { // Alt+U
                e.preventDefault();
                viewsource();
            }
        };

        return;
    }

    urlbeautify = urlpage.replace(urlbeautify, '');
    urlbeautify = decodeURIComponent(urlbeautify);

    var blobURL, worker,

        addstyle = function (aCss) {
            var head = doc.getElementsByTagName('head')[0];
            if (!head) return null;
            var style = doc.createElement('style');
            style.setAttribute('type', 'text/css');
            style.textContent = aCss;
            head.appendChild(style);
            return style;
        };

    blobURL = URL.createObjectURL(new Blob(['(',
        function () {
            self.window = {};

            self.onmessage = function (e) {
                var source = e.data.content;

                importScripts('https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-html.min.js');
                source = self.window.html_beautify(source);

                self.postMessage({
                    action: 'beautify',
                    source: source
                });

                importScripts('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js');
                source = self.window.hljs.highlight('xml', source, true).value;

                source = source.split('\n');
                source = source.join('</code><code>');
                source = '<code>' + source + '</code>';

                self.postMessage({
                    action: 'hljs',
                    source: source
                });
            };

        }.toString(),
        ')()'
    ], {
        type: 'text/javascript'
    }));
    worker = new Worker(blobURL);

    worker.onmessage = function (e) {
        if (!e.data) return;
        var fragment = doc.createDocumentFragment(),
            pre = doc.createElement('pre');

        if (e.data.action === 'beautify') {
            addstyle('*{margin:0;padding:0}html{line-height:1em;background:#1d1f21;color:#c5c8c6}pre{counter-reset:line-numbers;white-space:pre-wrap}code::before{counter-increment:line-numbers;content:counter(line-numbers);display:block;position:absolute;left:-4.5em;top:0;width:4em;text-align:right;color:#60686f;white-space:pre}code{display:block;position:relative;margin-left:4em;padding-left:.5em;min-height:1em;border-left:1px solid #32363b}pre{padding:.5em .5em .5em 5em;border-left:1px solid #1d1f21}pre.hljs{padding-left:.5em;border-left:0 none}code::after{content:".";visibility:hidden}a{color:#b5bd68}a:active,a:hover,a:visited{color:#8b9433} .hljs-comment,.hljs-quote{color:#969896}.hljs-variable,.hljs-template-variable,.hljs-tag,.hljs-name,.hljs-selector-id,.hljs-selector-class,.hljs-regexp,.hljs-deletion{color:#c66}.hljs-number,.hljs-built_in,.hljs-builtin-name,.hljs-literal,.hljs-type,.hljs-params,.hljs-meta,.hljs-link{color:#de935f}.hljs-attribute{color:#f0c674}.hljs-string,.hljs-symbol,.hljs-bullet,.hljs-addition{color:#b5bd68}.hljs-title,.hljs-section{color:#81a2be}.hljs-keyword,.hljs-selector-tag{color:#b294bb}.hljs{display:block;overflow-x:auto;background:#1d1f21;color:#c5c8c6;padding:.5em}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}');

            pre.textContent = e.data.source;
            fragment.appendChild(pre);
            doc.body.appendChild(fragment);
        } else {
            pre.innerHTML = e.data.source;
            pre.className = 'hljs xml';
            fragment.appendChild(pre);
            doc.body.replaceChild(fragment, doc.getElementsByTagName('pre')[0]);

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
    };

    GM.xmlHttpRequest({
        method: 'GET',
        url: urlbeautify,
        onload: function (response) {
            doc.title = 'beautify-source:' + urlbeautify;
            worker.postMessage({
                content: response.response
            });

            var baseUrl,
                baseMatch = response.response.match(/<base\s+href="([^"]+)"\s?[^>]*>/),
                base = doc.createElement('base');

            baseUrl = baseMatch ? baseMatch[1] : urlbeautify.replace(/[^/]*$/, '');

            base.href = baseUrl;
            doc.head.appendChild(base);
        }
    });

}());
