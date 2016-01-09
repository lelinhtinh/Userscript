// ==UserScript==
// @name        Javascript-css beautify
// @namespace   http://devs.forumvi.com
// @description Beautify and syntax highlight javascript/css source code
// @include     *
// @version     2.1.1
// @author      Zzbaivong
// @resource    light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/github-gist.min.css
// @resource    dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/monokai-sublime.min.css
// @require     https://openuserjs.org/src/libs/baivong/beautify-js.min.js
// @require     https://openuserjs.org/src/libs/baivong/beautify-css.min.js
// @require     https://openuserjs.org/src/libs/baivong/highlight-css-js.min.js
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_getResourceText
// ==/UserScript==

(function() {

    "use strict";

    var theme = "light", // light|dark

        url = window.top.location,
        contenttype = document.contentType;

    if (/^(application\/x-javascript|text\/css)$/.test(contenttype) || /.+\.(js|css)$/.test(url)) {

        var output = document.getElementsByTagName('pre')[0],
            txt = output.textContent,
            lang = "javascript",
            lines = 0,
            l = "";

        GM_addStyle(GM_getResourceText(theme) + "html,body,pre{margin:0;padding:0}.hljs{white-space:pre;padding-left:4em;line-height:100%}.hljs::before{content:attr(data-lines);position:absolute;color:#d2d2d2;text-align:right;width:3.5em;left:-.5em;border-right:1px solid rgba(221, 221, 221, 0.36);padding-right:.5em}#scroll-x{position:fixed;right:0;top:0;width:120px;cursor:w-resize;z-index:999;background:transparent;bottom:0}");

        if (contenttype === "text/css" || /.+\.css$/.test(url)) {
            lang = "css";
            txt = css_beautify(txt);
        } else {
            txt = js_beautify(txt);
        }

        output.textContent = txt;
        output.setAttribute("class", lang);

        hljs.highlightBlock(output);

        lines = txt.split("\n");
        lines = lines ? lines.length : 0;
        for (var i = 0; i < lines; i++) {
            l += (i + 1) + "\n";
        }

        output.setAttribute("data-lines", l);

        var node = document.createElement("DIV");
        node.id = "scroll-x";
        document.body.appendChild(node);

        node.onwheel = function(e) {
            e.preventDefault();
            output.scrollLeft += (e.deltaY * 10);
            return false;
        };

    }

}());