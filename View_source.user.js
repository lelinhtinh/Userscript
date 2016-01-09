// ==UserScript==
// @name        viewsource
// @namespace   devs.forumvi.com
// @description Viewsource for Firefox, like Chrome
// @include     *
// @version     2.1.0
// @author      Zzbaivong
// @resource    light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/github-gist.min.css
// @resource    dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/monokai-sublime.min.css
// @require     https://openuserjs.org/src/libs/baivong/beautify-html.js
// @require     https://openuserjs.org/src/libs/baivong/beautify-js.min.js
// @require     https://openuserjs.org/src/libs/baivong/beautify-css.min.js
// @require     https://openuserjs.org/src/libs/baivong/highlight-xml.js
// @run-at      doc-end
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// ==/UserScript==

(function() {

    "use strict";

    var theme = "light", // light|dark

        urlpage = window.top.location.href,
        doc = document;

    function viewsource() {
        GM_xmlhttpRequest({
            method: "GET",
            url: urlpage,
            onload: function(response) {

                var txt = html_beautify(response.response),
                    content = doc.body;

                doc.head.innerHTML = "";
                content.innerHTML = "";
                content.removeAttribute("id");
                content.removeAttribute("class");
                content.removeAttribute("style");
                content.removeAttribute("onload");
                doc.title = "view-source:" + urlpage;

                GM_addStyle(GM_getResourceText(theme) + "html,body,pre{margin:0;padding:0}.hljs{white-space:pre;padding-left:4em;line-height:100%}.hljs::before{content:attr(data-lines);position:absolute;color:#d2d2d2;text-align:right;width:3.5em;left:-.5em;border-right:1px solid rgba(221, 221, 221, 0.36);padding-right:.5em}#scroll-x{position:fixed;right:0;top:0;width:120px;cursor:w-resize;z-index:999;background:transparent;bottom:0}");

                var output = doc.createElement("PRE");
                output.setAttribute("class", "xml");
                output.textContent = txt;

                content.appendChild(output);

                hljs.highlightBlock(output);

                var lines = txt.split("\n"),
                    l = "";
                lines = lines ? lines.length : 0;
                for (var i = 0; i < lines; i++) {
                    l += (i + 1) + "\n";
                }

                output.setAttribute("data-lines", l);

                var node = doc.createElement("DIV");
                node.id = "scroll-x";
                content.appendChild(node);

                node.onwheel = function(e) {
                    e.preventDefault();
                    output.scrollLeft += (e.deltaY * 10);
                    return false;
                };

                var attrUrl = doc.getElementsByClassName('hljs-attr');
                for (var j = 0; j < attrUrl.length; j++) {
                    if (/\b(src|href\b)/.test(attrUrl[j].textContent)) {
                        var link = attrUrl[j].nextSibling.nextSibling;
                        var url = link.textContent.slice(1, -1);
                        link.innerHTML = '"<a href="' + url + '" target="_blank">' + url + '</a>"';
                    }
                }

            }
        });
    }

    GM_registerMenuCommand("View source", viewsource, "m");

    if (doc.contentType === "text/html" && doc.URL === urlpage) {
        window.onkeydown = function(e) {

            // Ctrl + M
            if (e.which == 77 && e.ctrlKey) {
                e.preventDefault();

                viewsource();
            }
        };
    }
}());
