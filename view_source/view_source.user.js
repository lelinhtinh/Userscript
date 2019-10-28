// ==UserScript==
// @name            viewsource
// @name:vi         viewsource
// @namespace       devs.forumvi.com
// @description     View and beautify page source. Shortcut: Alt+U.
// @description:vi  Định dạng và làm đẹp mã nguồn trang web. Phím tắt: Alt+U.
// @version         3.2.3
// @icon            http://i.imgur.com/6yZMOeH.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*/*
// @match           https://*/*
// @resource        js_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.2/beautify.min.js
// @resource        css_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.2/beautify-css.min.js
// @resource        html_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.2/beautify-html.min.js
// @resource        hljs https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/highlight.min.js
// @resource        dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/styles/atom-one-dark.min.css
// @resource        light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/styles/atom-one-light.min.css
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         *
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.getResourceUrl
// @grant           GM_getResourceURL
// @grant           GM_addStyle
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
// @grant           GM.openInTab
// @grant           GM_openInTab
// @grant           GM_registerMenuCommand
// ==/UserScript==

/* eslint-env worker, es6 */
(function() {
  'use strict';

  /**
   * Color themes
   * @type {String} dark|light
   */
  const STYLE = 'dark';

  /* === DO NOT CHANGE === */

  var doc = document,
    urlpage = location.href,
    urlbeautify = 'https://lelinhtinh.github.io/Userscript/?beautify-source=';

  if (!/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(doc.contentType)) return;

  if (urlpage.indexOf(urlbeautify) !== 0) {
    var viewsource = function() {
      if (urlpage.indexOf(urlbeautify) === 0) return;
      GM.openInTab(urlbeautify + encodeURIComponent(urlpage), false);
    };

    GM_registerMenuCommand('Beautify Page Source', viewsource, 'u');
    doc.onkeydown = function(e) {
      if (e.which === 85 && e.altKey) {
        // Alt+U
        e.preventDefault();
        viewsource();
      }
    };

    return;
  }

  urlbeautify = urlpage.replace(urlbeautify, '');
  urlbeautify = decodeURIComponent(urlbeautify);

  var blobURL, worker;

  blobURL = URL.createObjectURL(
    new Blob(
      [
        '(',
        function() {
          self.window = {};

          self.onmessage = function(e) {
            var source = e.data.content;

            importScripts(e.data.libs[0]);
            importScripts(e.data.libs[1]);
            importScripts(e.data.libs[2]);
            source = self.window.html_beautify(source, {
              indent_scripts: 'keep',
            });

            importScripts(e.data.libs[3]);
            source = self.window.hljs.highlight('xml', source, true).value;

            self.postMessage({
              source: source,
            });
          };
        }.toString(),
        ')()',
      ],
      {
        type: 'text/javascript',
      }
    )
  );
  worker = new Worker(blobURL);

  worker.onmessage = function(e) {
    if (!e.data) return;

    var fragment = doc.createDocumentFragment(),
      pre = doc.createElement('pre');

    pre.innerHTML = e.data.source;
    pre.className = 'hljs xml';

    fragment.appendChild(pre);
    doc.body.appendChild(fragment);

    var attrUrl = doc.getElementsByClassName('hljs-attr');
    for (var j = 0; j < attrUrl.length; j++) {
      if (/\b(src|href\b)/.test(attrUrl[j].textContent)) {
        var link = attrUrl[j].nextSibling.nextSibling,
          url = link.textContent,
          quote = url.slice(0, 1);

        if (quote !== "'" && quote !== '"') {
          quote = '';
        } else {
          url = url.slice(1, -1);
        }

        link.innerHTML = quote + '<a href="' + url + '" target="_blank">' + url + '</a>' + quote;
      }
    }
  };

  var js_beautify = GM.getResourceUrl('js_beautify'),
    css_beautify = GM.getResourceUrl('css_beautify'),
    html_beautify = GM.getResourceUrl('html_beautify'),
    hljs = GM.getResourceUrl('hljs');

  GM.getResourceUrl(STYLE)
    .then(function(url) {
      return fetch(url);
    })
    .then(function(resp) {
      return resp.text();
    })
    .then(function(style) {
      GM_addStyle(
        '*{margin:0;padding:0}html{line-height:1em;background:#1d1f21;color:#c5c8c6}pre{white-space:pre-wrap;word-wrap:break-word;word-break:break-all}' +
          style
      );
    });

  GM.xmlHttpRequest({
    method: 'GET',
    url: urlbeautify,
    onload: function(response) {
      doc.title = 'beautify-source:' + urlbeautify;

      Promise.all([js_beautify, css_beautify, html_beautify, hljs]).then(function(urls) {
        worker.postMessage({
          libs: urls,
          content: response.response,
        });
      });

      var baseUrl,
        baseMatch = response.response.match(/<base\s+href="([^"]+)"\s?[^>]*>/),
        base = doc.createElement('base');

      baseUrl = baseMatch ? baseMatch[1] : urlbeautify.replace(/[^/]*$/, '');

      base.href = baseUrl;
      doc.head.appendChild(base);
    },
  });
})();
