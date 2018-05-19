// ==UserScript==
// @name         Javascript-css beautify
// @namespace    http://devs.forumvi.com
// @description  Beautify and syntax highlighting for source code javascript, json, css.
// @version      3.0.0
// @icon         http://i.imgur.com/kz8nqz1.png
// @author       Zzbaivong
// @oujs:author  baivong
// @license      MIT; https://baivong.mit-license.org/license.txt
// @match        http://*/*
// @match        https://*/*
// @noframes
// @supportURL   https://github.com/lelinhtinh/Userscript/issues
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/* global importScripts */
(function () {
    'use strict';

    var doc = document,
        contenttype = doc.contentType,
        pathname = location.pathname;

    if (!(/^application\/(x-javascript|javascript|json)|text\/css$/.test(contenttype) || (/.+\.(js|json|css)$/.test(pathname) && !/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(contenttype)))) return;

    var output = doc.getElementsByTagName('pre')[0],
        lang = 'javascript',
        blobURL, worker,

        addstyle = function (aCss) {
            var head = doc.getElementsByTagName('head')[0];
            if (!head) return null;
            var style = doc.createElement('style');
            style.setAttribute('type', 'text/css');
            style.textContent = aCss;
            head.appendChild(style);
            return style;
        };

    if (contenttype === 'text/css' || /.+\.css$/.test(pathname)) lang = 'css';

    blobURL = URL.createObjectURL(new Blob(['(',
        function () {
            self.window = {};

            self.onmessage = function (e) {
                var source = e.data.content,
                    beautify = 'js_beautify';

                if (e.data.lang === 'javascript') {
                    importScripts('https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify.min.js');
                } else {
                    importScripts('https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-css.min.js');
                    beautify = 'css_beautify';
                }
                source = self.window[beautify](source);

                self.postMessage({
                    action: 'beautify',
                    source: source
                });

                importScripts('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js');
                source = self.window.hljs.highlight(e.data.lang, source, true).value;

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
            addstyle('*{margin:0;padding:0}html{line-height:1em;background:#1d1f21;color:#c5c8c6}pre{counter-reset:line-numbers;white-space:pre-wrap}code::before{counter-increment:line-numbers;content:counter(line-numbers);display:block;position:absolute;left:-4.5em;top:0;width:4em;text-align:right;color:#60686f;white-space:pre}code{display:block;position:relative;margin-left:4em;padding-left:.5em;min-height:1em;border-left:1px solid #32363b}pre{padding:.5em .5em .5em 5em;border-left:1px solid #1d1f21}pre.hljs{padding-left:.5em;border-left:0 none}code::after{content:".";visibility:hidden} .hljs-comment,.hljs-quote{color:#969896}.hljs-variable,.hljs-template-variable,.hljs-tag,.hljs-name,.hljs-selector-id,.hljs-selector-class,.hljs-regexp,.hljs-deletion{color:#c66}.hljs-number,.hljs-built_in,.hljs-builtin-name,.hljs-literal,.hljs-type,.hljs-params,.hljs-meta,.hljs-link{color:#de935f}.hljs-attribute{color:#f0c674}.hljs-string,.hljs-symbol,.hljs-bullet,.hljs-addition{color:#b5bd68}.hljs-title,.hljs-section{color:#81a2be}.hljs-keyword,.hljs-selector-tag{color:#b294bb}.hljs{display:block;overflow-x:auto;background:#1d1f21;color:#c5c8c6;padding:.5em}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}');

            pre.textContent = e.data.source;
        } else {
            pre.innerHTML = e.data.source;
            pre.className = 'hljs ' + lang;
        }

        fragment.appendChild(pre);
        doc.body.replaceChild(fragment, output);

        if (e.data.action === 'beautify') output = doc.getElementsByTagName('pre')[0];
    };

    worker.postMessage({
        lang: lang,
        content: output.textContent
    });

}());
