// ==UserScript==
// @name            Javascript-css beautify
// @name:vi         Javascript-css beautify
// @namespace       http://devs.forumvi.com
// @description     Beautify and syntax highlighting for source code JavaScript, JSON, CSS.
// @description:vi  Định dạng và làm đẹp mã nguồn JavaScript, JSON, CSS.
// @version         4.0.0
// @icon            http://i.imgur.com/kz8nqz1.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*/*
// @match           https://*/*
// @resource        prettier https://unpkg.com/prettier@2.0.5/standalone.js
// @resource        parser-babel https://unpkg.com/prettier@2.0.5/parser-babel.js
// @resource        parser-postcss https://unpkg.com/prettier@2.0.5/parser-postcss.js
// @resource        hljs https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/highlight.min.js
// @resource        dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/atom-one-dark.min.css
// @resource        light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/atom-one-light.min.css
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
(() => {
  'use strict';

  /**
   * Color themes
   * @type {'dark'|'light'}
   */
  const STYLE = 'dark';

  /* === DO NOT CHANGE === */

  const doc = document,
    contentType = doc.contentType,
    pathname = location.pathname;

  if (
    !(
      /^application\/(x-javascript|javascript|json)|text\/css$/.test(contentType) ||
      (/.+\.(js|json|css)$/.test(pathname) &&
        !/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(contentType))
    )
  )
    return;

  let parser;
  if (contentType === 'text/css' || /.+\.css$/.test(pathname)) {
    parser = 'css';
  } else if (contentType === 'application/json' || /.+\.json$/.test(pathname)) {
    parser = 'json';
  } else {
    parser = 'babel';
  }

  const blobURL = URL.createObjectURL(
    new Blob(
      [
        '(',
        function () {
          self.onmessage = (e) => {
            let source = e.data.content;

            importScripts(e.data.libs[0]);
            importScripts(e.data.libs[1]);
            /* global prettierPlugins */
            source = prettier.format(source, { parser: e.data.parser, plugins: prettierPlugins });

            importScripts(e.data.libs[2]);
            source = hljs.highlight(e.data.parser === 'babel' ? 'javascript' : e.data.parser, source, true).value;

            self.postMessage({
              theme: e.data.libs[3],
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

  const output = doc.getElementsByTagName('pre')[0];
  const worker = new Worker(blobURL);

  worker.onmessage = (e) => {
    if (!e.data) return;

    const fragment = doc.createDocumentFragment(),
      pre = doc.createElement('pre');

    pre.innerHTML = e.data.source;
    pre.className = 'hljs';

    fragment.appendChild(pre);
    doc.body.replaceChild(fragment, output);

    GM_addStyle(
      `${e.data.theme}*{margin:0;padding:0}html{line-height:1em;background:${
        STYLE === 'dark' ? '#282c34' : '#fafafa'
      }}pre{white-space:pre-wrap;word-wrap:break-word;word-break:break-all}`
    );
  };

  const prettier = GM.getResourceUrl('prettier'),
    parserBabel = GM.getResourceUrl('parser-babel'),
    parserPostcss = GM.getResourceUrl('parser-postcss'),
    hljs = GM.getResourceUrl('hljs'),
    theme = GM.getResourceUrl(STYLE)
      .then((url) => fetch(url))
      .then((resp) => resp.text());

  Promise.all([prettier, parser === 'css' ? parserPostcss : parserBabel, hljs, theme]).then((urls) => {
    worker.postMessage({
      libs: urls,
      parser: parser,
      content: output.textContent,
    });
  });
})();
