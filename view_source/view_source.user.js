// ==UserScript==
// @name            viewsource
// @name:vi         viewsource
// @namespace       devs.forumvi.com
// @description     View and beautify page source. Shortcut: Alt+U.
// @description:vi  Định dạng và làm đẹp mã nguồn trang web. Phím tắt: Alt+U.
// @version         3.3.0
// @icon            http://i.imgur.com/6yZMOeH.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*/*
// @match           https://*/*
// @resource        js_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.12.0/beautify.min.js
// @resource        css_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.12.0/beautify-css.min.js
// @resource        html_beautify https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.12.0/beautify-html.min.js
// @resource        hljs https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/highlight.min.js
// @resource        dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/atom-one-dark.min.css
// @resource        light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/atom-one-light.min.css
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
(() => {
  'use strict';

  /**
   * Color themes
   * @type {String} dark|light
   */
  const STYLE = 'dark';

  /* === DO NOT CHANGE === */

  const urlpage = location.href;

  if (!/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(document.contentType)) return;

  GM_registerMenuCommand('Beautify Page Source', viewsource, 'u');
  document.onkeydown = (e) => {
    if (e.which === 85 && e.altKey) {
      // Alt+U
      e.preventDefault();
      viewsource();
    }
  };

  const handleURL = URL.createObjectURL(
    new Blob(
      [
        '(',
        function () {
          self.window = {};

          self.onmessage = (e) => {
            var source = e.data.content;

            importScripts(e.data.libs[0]);
            importScripts(e.data.libs[1]);
            importScripts(e.data.libs[2]);
            source = self.window.html_beautify(source, {
              indent_scripts: 'keep',
            });

            importScripts(e.data.libs[3]);
            source = self.hljs.highlight('xml', source, true).value;

            self.postMessage({
              base: e.data.base,
              theme: e.data.libs[4],
              source: source,
            });
          };
        }.toString(),
        ')()',
      ],
      {
        type: 'application/javascript',
      }
    )
  );

  const worker = new Worker(handleURL);
  worker.onmessage = (e) => {
    if (!e.data) return;

    const viewSourceURL = URL.createObjectURL(
      new Blob(
        [
          `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <base href="${e.data.base}" target="_blank">
            <title>beautify-source:${urlpage}</title>
            <style>${e.data.theme}*{margin:0;padding:0}html{line-height:1em;background:#1d1f21;color:#c5c8c6}pre{white-space:pre-wrap;word-wrap:break-word;word-break:break-all}a{color:#4d4bd8}</style>
          </head>
          <body>
            <pre class="hljs xml">${e.data.source}</pre>
            <script>
            const attrUrl = document.getElementsByClassName('hljs-attr');
            for (let j = 0; j < attrUrl.length; j++) {
              if (/\\b(src|href\\b)/.test(attrUrl[j].textContent)) {
                let link = attrUrl[j].nextSibling.nextSibling,
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
            </script>
          </body>
          </html>`,
        ],
        {
          type: 'text/html; charset=utf-8',
        }
      )
    );

    GM.openInTab(urlpage, true);
    location.href = viewSourceURL;
  };

  function viewsource() {
    const js_beautify = GM.getResourceUrl('js_beautify'),
      css_beautify = GM.getResourceUrl('css_beautify'),
      html_beautify = GM.getResourceUrl('html_beautify'),
      hljs = GM.getResourceUrl('hljs'),
      theme = GM.getResourceUrl(STYLE)
        .then(function (url) {
          return fetch(url);
        })
        .then(function (resp) {
          return resp.text();
        });

    GM.xmlHttpRequest({
      method: 'GET',
      url: urlpage,
      onload: (response) => {
        const baseMatch = response.response.match(/<base[\s\n]+href[\s\n]*=[\s\n]*("|')?([^"'\s\n]+)("|')?.*?\/?>/i);

        Promise.all([js_beautify, css_beautify, html_beautify, hljs, theme]).then((urls) => {
          worker.postMessage({
            libs: urls,
            base: baseMatch ? baseMatch[2] : urlpage.replace(/[^/]*$/, ''),
            content: response.response,
          });
        });
      },
    });
  }
})();
