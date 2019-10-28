// ==UserScript==
// @name            Javascript-css beautify
// @name:vi         Javascript-css beautify
// @namespace       http://devs.forumvi.com
// @description     Beautify and syntax highlighting for source code JavaScript, JSON, CSS.
// @description:vi  Định dạng và làm đẹp mã nguồn JavaScript, JSON, CSS.
// @version         3.2.3
// @icon            http://i.imgur.com/kz8nqz1.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*/*
// @match           https://*/*
// @resource        js_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.2/beautify.min.js
// @resource        css_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.2/beautify-css.min.js
// @resource        hljs https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/highlight.min.js
// @resource        dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/styles/atom-one-dark.min.css
// @resource        light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/styles/atom-one-light.min.css
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.getResourceUrl
// @grant           GM_getResourceURL
// @grant           GM_addStyle
// @grant           GM_getResourceText
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
    contenttype = doc.contentType,
    pathname = location.pathname;

  if (
    !(
      /^application\/(x-javascript|javascript|json)|text\/css$/.test(contenttype) ||
      (/.+\.(js|json|css)$/.test(pathname) &&
        !/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(contenttype))
    )
  )
    return;

  var output = doc.getElementsByTagName('pre')[0],
    lang = 'javascript',
    blobURL,
    worker;

  if (contenttype === 'text/css' || /.+\.css$/.test(pathname)) lang = 'css';

  blobURL = URL.createObjectURL(
    new Blob(
      [
        '(',
        function() {
          self.window = {};

          self.onmessage = function(e) {
            var source = e.data.content,
              beautify = 'js_beautify';

            if (e.data.lang === 'javascript') {
              importScripts(e.data.libs[0]);
            } else {
              importScripts(e.data.libs[1]);
              beautify = 'css_beautify';
            }
            source = self.window[beautify](source);

            importScripts(e.data.libs[2]);
            source = self.window.hljs.highlight(e.data.lang, source, true).value;

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
    pre.className = 'hljs ' + lang;

    fragment.appendChild(pre);
    doc.body.replaceChild(fragment, output);
  };

  var js_beautify = GM.getResourceUrl('js_beautify'),
    css_beautify = GM.getResourceUrl('css_beautify'),
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

  Promise.all([js_beautify, css_beautify, hljs]).then(function(urls) {
    worker.postMessage({
      libs: urls,
      lang: lang,
      content: output.textContent,
    });
  });
})();
