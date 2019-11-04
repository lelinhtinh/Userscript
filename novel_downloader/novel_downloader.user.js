// ==UserScript==
// @name            Novel downloader
// @name:vi         Novel downloader
// @namespace       https://lelinhtinh.github.io/
// @description     Tải truyện chữ định dạng EPUB.
// @description:vi  Tải truyện chữ định dạng EPUB.
// @version         1.0.0
// @icon            https://i.imgur.com/MkEc6dg.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://truyenyy.com/truyen/*/
// @require         https://unpkg.com/jszip@3.2.1/dist/jszip.min.js
// @require         https://unpkg.com/ejs@2.6.1/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.1/dist/jepub.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         *
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==

const configs = {
  'truyenfull.vn': {
    title: '[itemprop="name"]',
    author: '[itemprop="author"]',
    publisher: '.source',
    description: '[itemprop="description"]',
    tags: '[itemprop="genre"]',
    cover: '[itemprop="image"]',
    first: '.list-chapter a',
    next: '#next_chap',
    chapter: {
      id: '{{ id }}',
      title: '.chapter-title',
      content: '#chapter-c',
    },
  },
  /**
   * Example configs
   * @property {(string|function)} - selector
   */
  'domain.test': {
    title: 'selector',
    author: 'selector',
    publisher: 'selector',
    description: 'selector', // optional
    tags: 'selector', // optional
    cover: 'selector', // optional
    first: 'selector',
    next: 'selector',
    total: 'selector', // optional
    chapter: {
      id: 'chuong-{{ id }}',
      title: 'selector',
      content: 'selector',
    },
    placement: 'top-right', // top-left|top-right|bottom-left|bottom-left
  },
};

/* === DO NOT CHANGE === */
const DEBUG = 3;

function debug(obj, level = 1) {
  if (!DEBUG || typeof DEBUG !== 'number' || typeof level !== 'number' || level > 3 || level < 1) return;

  const clone = () => {
    if (Array.isArray(obj)) {
      return Object.assign([], obj);
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.assign({}, obj);
    }
    return obj;
  };

  if (level < DEBUG) return;

  const palette = {
    1: '#1e63b8',
    2: '#ecac43',
    3: '#fe2c32',
  };
  console.log('%cNovel Downloader', 'color:' + palette[level], clone());
}

function showError(mess) {
  debug(mess, 2);
}

function showFatal(mess) {
  debug(mess, 3);
  throw mess;
}

function saveEpub(e) {
  e.preventDefault();
  e.stopPropagation();
}

function readSelector(
  selector,
  opts = {
    html: false,
    multi: false,
  }
) {
  if (typeof selector === 'string') {
    return document['querySelector' + (opts.multi ? 'All' : '')](selector)[
      opts.html ? 'innerHTML' : 'textContent'
    ].trim();
  } else if (typeof selector === 'function') {
    return selector();
  }
  showFatal(selector);
}

function createEpub(e) {
  e.preventDefault();
  e.stopPropagation();
  $download.removeEventListener('click', createEpub);

  jepub = new jEpub();
  jepub
    .init({
      title: readSelector(novel.title),
      author: readSelector(novel.author),
      publisher: readSelector(novel.publisher),
      description: readSelector(novel.description, {
        html: true,
      }),
      tags: readSelector(novel.tags, {
        multi: true,
      }),
    })
    .uuid(novel.credit);

  debug(jepub);

  $download.addEventListener('click', saveEpub);
}

function setChapterBegin(e) {
  e.preventDefault();
  e.stopPropagation();
  $download.removeEventListener('contextmenu', setChapterBegin);

  if (!novel.chapter.id) {
    debug('Không có cấu hình chương bắt đầu', 2);
    return;
  }
}

function init() {
  $download = document.querySelector('#novelDownloaderButton');
  if ($download !== null) return;

  novel = configs[location.host];
  if (!novel) return;

  if (!novel.title || !novel.first || !novel.next || !novel.chapter || !novel.chapter.title || !novel.chapter.content) {
    showFatal('Cấu hình không hợp lệ');
  }

  novel = Object.assign(
    {},
    {
      author: 'Khuyết danh',
      publisher: 'Sưu tầm',
      placement: 'top-right',
    },
    novel
  );
  novel.credit = location.origin + location.pathname;

  debug(novel);

  $download = document.createElement('a');

  $download.className = 'novel-btn novel-place-' + novel.placement;
  $download.textContent = 'Tải EPUB';
  $download.href = '#download-epub';

  $download.addEventListener('click', createEpub);
  $download.addEventListener('contextmenu', setChapterBegin);

  document.body.appendChild($download);
}

/**
 * @type Document
 */
let $download;
let novel;
let jepub;

try {
  init();
} catch (e) {
  console.error(e);
}
