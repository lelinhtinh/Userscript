// ==UserScript==
// @name            Javascript-css beautify
// @name:vi         Javascript-css beautify
// @namespace       http://devs.forumvi.com
// @description     Beautify and syntax highlighting for source code JavaScript, JSON, CSS. From v4.1+, a few more formats are also supported.
// @description:vi  Định dạng và làm đẹp mã nguồn JavaScript, JSON, CSS. Từ bản v4.1+, một vài định dạng khác cũng được hỗ trợ .
// @version         4.1.0
// @icon            http://i.imgur.com/kz8nqz1.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           http://*/*
// @match           https://*/*
// @require         https://unpkg.com/prettier@2.0.5/standalone.js
// @require         https://unpkg.com/prettier@2.0.5/parser-postcss.js
// @require         https://unpkg.com/prettier@2.0.5/parser-html.js
// @require         https://unpkg.com/prettier@2.0.5/parser-babel.js
// @require         https://unpkg.com/prettier@2.0.5/parser-graphql.js
// @require         https://unpkg.com/prettier@2.0.5/parser-markdown.js
// @require         https://unpkg.com/prettier@2.0.5/parser-typescript.js
// @require         https://unpkg.com/prettier@2.0.5/parser-yaml.js
// @require         https://unpkg.com/prettier@2.0.5/parser-angular.js
// @require         https://unpkg.com/@prettier/plugin-php@0.14.3/standalone.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/highlight.min.js
// @resource        dark https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/atom-one-dark.min.css
// @resource        light https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/atom-one-light.min.css
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.getResourceUrl
// @grant           GM_getResourceURL
// @grant           GM_addStyle
// @inject-into     content
// ==/UserScript==

/* global prettier, prettierPlugins, hljs */
/* eslint-env worker, es6 */
(() => {
  'use strict';

  /**
   * Color themes
   * @type {'dark'|'light'}
   */
  const STYLE = 'dark';

  /* === DO NOT CHANGE === */

  const output = document.querySelector('body > pre');
  if (output === null) return;
  if (document.querySelector('body').firstElementChild.tagName !== 'PRE') return;

  const contentType = document.contentType,
    pathname = location.pathname;

  if (/^application\/(xhtml+xml|xml|rss+xml)|text\/(html|xml)$/.test(contentType)) return;

  let parser;
  if (contentType === 'text/css' || /.+\.css$/.test(pathname)) {
    parser = 'css';
  } else if (contentType === 'application/json' || /.+\.(json|map)$/.test(pathname)) {
    parser = 'json';
  } else if (/^application\/(x-javascript|javascript)$/.test(contentType) || /.+\.jsx?$/.test(pathname)) {
    parser = 'babel';
  } else if (contentType === 'text/plain') {
    if (/.+\.component\.html$/.test(pathname)) {
      parser = 'angular';
    } else if (/.+\.(gql|graphql)$/.test(pathname)) {
      parser = 'graphql';
    } else if (/.+\.ya?ml$/.test(pathname)) {
      parser = 'yaml';
    } else if (/.+\.(x?html?|xml)$/.test(pathname)) {
      parser = 'html';
    } else if (/.+\.tsx?$/.test(pathname)) {
      parser = 'typescript';
    } else if (/.+\.php$/.test(pathname)) {
      parser = 'php';
    } else if (/.+\.vue$/.test(pathname)) {
      parser = 'vue';
    } else if (/.+\.(less|scss)$/.test(pathname)) {
      parser = 'css';
    } else if (/.+\.(md|markdown)$/.test(pathname)) {
      parser = 'markdown';
    }
  }

  GM.getResourceUrl(STYLE)
    .then((url) => fetch(url))
    .then((resp) => resp.text())
    .then((style) =>
      GM_addStyle(
        `${style}*{margin:0;padding:0}html{line-height:1em;background:${
          STYLE === 'dark' ? '#282c34' : '#fafafa'
        }}pre{white-space:pre-wrap;word-wrap:break-word;word-break:break-all}`
      )
    );

  let source = output.textContent;

  try {
    if (parser) source = prettier.format(source, { parser: parser, plugins: prettierPlugins });
  } catch (err) {
    console.error(err);
  }

  source = hljs.highlightAuto(source).value;

  const fragment = document.createDocumentFragment(),
    pre = document.createElement('pre');

  pre.innerHTML = source;
  pre.className = 'hljs';

  fragment.appendChild(pre);
  document.body.replaceChild(fragment, output);
})();
