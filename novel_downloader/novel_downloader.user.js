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
// @match           https://truyenfull.vn/*
// @require         https://unpkg.com/jszip@3.2.1/dist/jszip.min.js
// @require         https://unpkg.com/ejs@2.6.1/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.1/dist/jepub.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==

const configs = {
  'truyenfull.vn': {
    title: '.title[itemprop="name"]',
    author: '.info [itemprop="author"]',
    publisher: '.info .source',
    description: '.desc-text[itemprop="description"]',
    tags: '.info [itemprop="genre"]',
    cover: '.book [itemprop="image"]',
    first: '.list-chapter a',
    next: '#next_chap',
    chapter: {
      id: '{{ id }}/',
      title: '.chapter-title',
      content: '#chapter-c',
    },
  },
  /**
   * Example configs
   * @property {(String|Function)} - selector
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
  if (level > DEBUG) return;

  const clone = () => {
    if (Array.isArray(obj)) {
      return Object.assign([], obj);
    } else if (typeof obj === 'object' && obj !== null && !(obj instanceof RegExp)) {
      return Object.assign({}, obj);
    }
    return obj;
  };

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

function cleanSource(ele) {
  ele.querySelectorAll('style, script').forEach(ss => ss.remove());
  let str = ele.innerHTML;
  str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
  return str.trim();
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
    attr: false,
  }
) {
  debug(selector);
  if (typeof selector === 'string') {
    try {
      debug(opts);
      if (opts.multi) {
        let temp = [];
        document.querySelectorAll(selector).forEach(ele => {
          ele = ele.textContent.trim();
          if (ele) temp.push(ele);
        });
        return temp;
      } else {
        let ele = document.querySelector(selector);
        if (opts.attr) {
          return ele.getAttribute(opts.attr);
        } else if (opts.html) {
          return cleanSource(ele);
        }
        return ele.textContent.trim();
      }
    } catch (e) {
      showError(e.message);
    }
    return null;
  } else if (typeof selector === 'function') {
    const result = selector();
    debug(result);
    return result;
  }
  showFatal(selector);
}

function createEpub(e) {
  e.preventDefault();
  e.stopPropagation();
  $download.removeEventListener('click', createEpub);

  const props = {
    title: novel.title,
    author: novel.author,
    publisher: novel.publisher,
  };
  if (novel.description) props.description = novel.description;
  if (novel.tags.length) props.tags = novel.tags;

  jepub = new jEpub();
  jepub.init(props).uuid(novel.credit);
  debug(jepub);

  $download.addEventListener('click', saveEpub);
}

function setChapterBegin(e) {
  e.preventDefault();
  e.stopPropagation();
  $download.removeEventListener('contextmenu', setChapterBegin);

  if (!novel.chapter.id) {
    showError('Không có cấu hình Chapter ID');
    return;
  }

  let chapId = novel.first.replace(novel.credit, '');
  debug(chapId);
  try {
    let patt = novel.chapter.id.replace(/([./?|()'"$*^])/g, '\\$1');
    patt = patt.replace(/\{\{\s*id\s*\}\}/i, '(.+?)');
    patt = new RegExp(patt);
    debug(patt);
    chapId = chapId.match(patt)[1];
    debug(chapId);
  } catch (e) {
    showFatal('Cấu hình Chapter ID không đúng');
  }

  const beginId = prompt('Nhập ID chương truyện bắt đầu tải:', chapId);
  if (beginId !== null) chapId = beginId;

  novel.first = novel.credit + novel.chapter.id.replace(/\{\{\s*id\s*\}\}/i, chapId);
  debug(novel.first);
}

function init() {
  $download = document.querySelector('#novelDownloaderButton');
  if ($download !== null) return;

  novel = configs[location.host];
  if (!novel) return;

  if (!novel.title || !novel.first || !novel.next || !novel.chapter || !novel.chapter.title || !novel.chapter.content) {
    showFatal('Cấu hình không hợp lệ');
  }

  novel.title = readSelector(novel.title);
  if (!novel.title) return;
  novel.first = readSelector(novel.first, { attr: 'href' });
  if (!novel.first) return;

  novel.credit = location.origin + location.pathname;
  novel.author = readSelector(novel.author) || 'Khuyết danh';
  novel.publisher = readSelector(novel.publisher) || 'Sưu tầm';
  novel.description = readSelector(novel.description, { html: true });
  novel.tags = readSelector(novel.tags, { multi: true });
  novel.cover = readSelector(novel.cover, { attr: 'src' });
  debug(novel);

  $download = document.createElement('a');
  $download.id = 'novelDownloaderButton';
  $download.className = 'novel-btn novel-place-' + (novel.placement || 'top-right');
  $download.textContent = 'Tải EPUB';
  $download.href = '#download-epub';

  $download.addEventListener('click', createEpub);
  $download.addEventListener('contextmenu', setChapterBegin);

  document.body.appendChild($download);
  debug($download);
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
