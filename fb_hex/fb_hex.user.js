// ==UserScript==
// @name            Facebook HEX
// @name:vi         Facebook HEX
// @namespace       https://lelinhtinh.github.io
// @description     Convert HEX to text, in a post or comment on Facebook.
// @description:vi  Chuyển đổi HEX thành URL hoặc text, trong bài viết hoặc bình luận trên Facebook.
// @version         0.9.1
// @icon            https://i.imgur.com/oz5CjJe.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://*.facebook.com/*
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.openInTab
// @grant           GM_openInTab
// ==/UserScript==

/**
 * If `true`, open in new tab after clicking on decoded link.
 * @type {boolean} true or false
 */
const COPY_ONLY = false;

/**
 * Makes the tab being opened inside a incognito mode/private mode window.
 * Currently, only works with Tampermonkey BETA.
 * @type {boolean} true or false
 */
const PRIVATE = true;

/* === DO NOT CHANGE === */
function fallbackCopyTextToClipboard(text) {
  let textArea = document.createElement('textarea');
  textArea.value = text;

  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }

  navigator.clipboard.writeText(text).catch(err => {
    console.error('Async: Could not copy text', err);
  });
}

function validURL(str) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$',
    'i'
  );

  return !!pattern.test(str);
}

function hex2ascii(hex) {
  if (!(typeof hex === 'number' || typeof hex == 'string')) return '';

  hex = hex.toString().replace(/\s+/gi, '');
  const stack = [];

  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (!isNaN(code) && code !== 0) {
      stack.push(String.fromCharCode(code));
    }
  }

  return stack.join('');
}

function cleanWordBreak(post) {
  if (post.querySelector('.word_break') !== null) {
    post.querySelectorAll('wbr').forEach(e => e.remove());

    post.querySelectorAll('span').forEach(span => {
      if (span.querySelector('span, img') !== null) return;
      const text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
    });
  }
}

function getResult(post) {
  let content = post.textContent.match(/\b[a-f0-9\s]{12,}\b/i);
  if (content === null) return;

  content = content[0].trim();
  const result = hex2ascii(content);

  return { content, result };
}

function handle(post) {
  if (post.querySelector('.fb-hex') !== null) return;
  cleanWordBreak(post);

  const { content, result } = getResult(post);
  copyTextToClipboard(result);

  post.innerHTML = post.innerHTML.replace(
    content,
    `
    <strong
      class="fb-hex${validURL(result) ? ' fb-hex-link' : ''}"
      title="Copied to clipboard${COPY_ONLY ? '' : '\nClick to open in new tab'}"
      ${COPY_ONLY ? '' : ' style="cursor:pointer"'}
    >${result}</strong>
    `
  );
}

function getPost(e) {
  const target = e.target;

  let post = target.closest('.msg');
  if (post !== null) {
    handle(post.querySelector('div'));
    return;
  }

  post = target.closest('[data-sigil="comment-body"]');
  if (post !== null) {
    handle(post);
    return;
  }

  post = target.closest('p, span, [dir="auto"], [data-ft] > div[style]');
  if (post === null) return;

  const parent = post.parentNode;
  if (parent.querySelector('.word_break') !== null) {
    handle(parent);
    return;
  }

  handle(post);
}

document.addEventListener('click', getPost);

function decodedClicking(e) {
  const target = e.target;
  if (!target.classList.contains('fb-hex')) return;

  const result = target.textContent;
  copyTextToClipboard(result);

  if (COPY_ONLY) return;
  if (!target.classList.contains('fb-hex-link')) return;

  GM.openInTab(result, {
    active: true,
    insert: true,
    incognito: PRIVATE,
  });
}

document.addEventListener('click', decodedClicking);
