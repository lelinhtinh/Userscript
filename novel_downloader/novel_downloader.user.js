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
// @match           https://truyenvkl.com/*
// @require         https://unpkg.com/jszip@3.2.1/dist/jszip.min.js
// @require         https://unpkg.com/ejs@2.6.1/ejs.min.js
// @require         https://unpkg.com/jepub@2.1.1/dist/jepub.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @connect         imgur.com
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==

const configs = {
  'truyenvkl.com': {
    title: '.info .entry-title',
    author: '.info .author',
    description: '#gioithieu',
    tags: '.info .tags',
    cover: '.cover img',
    first: '.info .btns .primary-btn',
    chapter: {
      id: '{{ id }}',
      title: '#bookMain .bookHeading',
      content: '#bookMain .bookContent',
      next: '.nextchap',
    },
  },
  'truyenfull.vn': {
    title: '.title[itemprop="name"]',
    author: '.info [itemprop="author"]',
    publisher: '.info .source',
    description: '.desc-text[itemprop="description"]',
    tags: '.info [itemprop="genre"]',
    cover: '.book [itemprop="image"]',
    first: '.list-chapter a',
    chapter: {
      id: '{{ id }}/',
      title: '.chapter-title',
      content: '#chapter-c',
      next: '#next_chap',
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
    total: 'selector', // optional
    chapter: {
      id: 'chuong-{{ id }}',
      title: 'selector',
      content: 'selector',
      next: 'selector',
    },
    placement: 'top-right', // top-left|top-right|bottom-left|bottom-left
  },
};

/* === DO NOT CHANGE === */
const DEBUG = 3;

function debug(name, obj, level = 1) {
  if (!DEBUG || typeof DEBUG !== 'number' || typeof level !== 'number' || level > 3 || level < 1) return;
  if (level > DEBUG) return;

  const clone = () => {
    if (obj === null) return null;
    if (obj === undefined) return undefined;
    if (Array.isArray(obj)) {
      return Object.assign([], obj);
    } else if (obj.constructor === Object) {
      return Object.assign({}, obj);
    }
    return obj;
  };

  const palette = {
    1: '#1e63b8',
    2: '#ecac43',
    3: '#fe2c32',
  };
  console.log('%c' + name, 'color:' + palette[level], clone());
}

function showError(mess) {
  debug('Error', mess, 2);
}

function showFatal(mess) {
  debug('Fatal', mess, 3);
  throw mess;
}

function cleanSource(ele) {
  ele.querySelectorAll('style, script').forEach(ss => ss.remove());
  let str = ele.innerHTML;
  str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
  return str.trim();
}

function saveEpub(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function readSelector(
  selector,
  opts = {
    html: false,
    multi: false,
    attr: false,
  }
) {
  if (typeof selector === 'string') {
    try {
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
    return result;
  }
  return null;
}

function getChapter() {
  if (!novel.next) novel.next = novel.first;
  debug('Chapter URL', novel.next);
  fetch(novel.next)
    .then(res => res.text())
    .then(res => {
      const parser = new DOMParser();
      return parser.parseFromString(res, 'text/html');
    })
    .then(res => {
      let title = res.querySelector(novel.chapter.title);
      debug('Chapter title', title);
      let content = res.querySelector(novel.chapter.content);
      debug('Chapter content', content);
      let next = res.querySelector(novel.chapter.next);
      debug('Chapter next', next);

      if (content === null) {
        showError('Rỗng');
      } else {
        content = content.innerHTML;
      }

      if (title === null) {
        title = content.match(/(Chương .+?)(<|\n)/i);
        title = title === null ? 'Không đề' : title[1].trim();
      } else {
        title = title.textContent.trim();
      }

      if (!next || !next.href || !novel.chapter.patt.test(next.href)) {
        saveEpub();
        return;
      }
      next = next.href;
    });
}

function genEpub() {
  $download.removeEventListener('click', createEpub);
  $download.removeEventListener('contextmenu', setChapterBegin);
  $download.addEventListener('click', saveEpub);

  const props = {
    title: novel.title,
    author: novel.author,
    publisher: novel.publisher,
  };
  if (novel.description) props.description = novel.description;
  if (novel.tags.length) props.tags = novel.tags;

  jepub = new jEpub();
  jepub.init(props).uuid(novel.credit);
  debug('jEpub', jepub);

  GM.xmlHttpRequest({
    method: 'GET',
    url: novel.cover,
    responseType: 'arraybuffer',
    onload: function(response) {
      jepub.cover(response.response);
    },
    onerror: function(err) {
      console.error(err);
    },
  });

  getChapter();
}

function createEpub(e) {
  e.preventDefault();
  e.stopPropagation();
  genEpub();
}

function setChapterBegin(e) {
  e.preventDefault();
  e.stopPropagation();

  if (!novel.chapter.id) {
    showError('Không có cấu hình Chapter ID');
    return;
  }

  let chapId = novel.first.replace(novel.credit, '');
  try {
    chapId = chapId.match(novel.chapter.patt)[1];
  } catch (e) {
    showFatal('Cấu hình Chapter ID không đúng');
  }

  const beginId = prompt('Nhập ID chương truyện bắt đầu tải:', chapId);
  if (beginId !== null) chapId = beginId;

  novel.first = novel.credit + novel.chapter.id.replace(/\{\{\s*id\s*\}\}/i, chapId);
  debug('URL first', novel.first);

  genEpub();
}

function init() {
  $download = document.querySelector('#novelDownloaderButton');
  if ($download !== null) return;

  novel = configs[location.host];
  if (!novel) return;

  if (
    !novel.title ||
    !novel.first ||
    !novel.chapter ||
    !novel.chapter.title ||
    !novel.chapter.content ||
    !novel.chapter.next
  ) {
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

  let patt = novel.chapter.id.replace(/([./?|()'"$*^])/g, '\\$1');
  patt = patt.replace(/\{\{\s*id\s*\}\}/i, '(.+?)');
  patt = new RegExp(patt);
  novel.chapter.patt = patt;
  debug('Novel', novel);

  $download = document.createElement('a');
  $download.id = 'novelDownloaderButton';
  $download.className = 'novel-btn novel-place-' + (novel.placement || 'top-right');
  $download.textContent = 'Tải EPUB';
  $download.href = '#download-epub';

  $download.addEventListener('click', createEpub);
  $download.addEventListener('contextmenu', setChapterBegin);

  document.body.appendChild($download);
  debug('Download button', $download);
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
