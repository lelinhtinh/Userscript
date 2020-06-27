// ==UserScript==
// @name            Phim4400 Helper
// @name:vi         Phim4400 Helper
// @namespace       https://lelinhtinh.github.io
// @description     Xem online và tải phim trực tiếp tại Phim4400, bỏ qua quảng cáo.
// @description:vi  Xem online và tải phim trực tiếp tại Phim4400, bỏ qua quảng cáo.
// @version         1.3.0
// @icon            https://i.imgur.com/wRRkkqr.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://phim440.cf/*
// @match           https://phim4400.cf/*
// @match           https://phim4400.tv/*
// @require         https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
// ==/UserScript==

/* global shortcut, sha256 */
(function () {
  'use strict';

  document.oncontextmenu = null;
  if (shortcut) {
    shortcut.remove('Ctrl+U');
    shortcut.remove('F12');
    shortcut.remove('Ctrl+Shift+I');
    shortcut.remove('Ctrl+S');
    shortcut.remove('Ctrl+Shift+C');
  }

  if (location.pathname.indexOf('/phim/') === -1) {
    let $btn = document.querySelector('.button-phim'),
      link = $btn.search;

    if (!link) return;
    link = new URLSearchParams(link);
    if (!link.has('url')) return;
    link = atob(link.get('url'));
    if (link.indexOf('/phim/') === -1) return;

    if ($btn === null) {
      $btn = document.createElement('a');
      $btn.textContent = 'Xem Online và Tải Phim';
      document.querySelector('.button-info').appendChild($btn);
    }

    $btn.className = 'button-phim uk-button uk-button-default uk-dropdown-right';
    $btn.setAttribute('target', '_top');

    $btn.href = link;
    return;
  }

  const $videoWrap = document.querySelector('.xem-phim');
  if ($videoWrap.innerHTML.trim() !== '') return;

  function renderVideo(src) {
    let $video = document.querySelector('#vipPlayer');

    if ($video === null) {
      $video = document.createElement('video');
      $video.id = 'vipPlayer';
      $video.controls = true;
      $video.preload = 'auto';
      $video.setAttribute(
        'style',
        `
          height: 450px;
          width: 100%;
        `
      );
      $video.addEventListener('error', () => {
        $content.innerHTML = `
          <p class="uk-text-center uk-card-body">
            <em>
              <big>Không thể phát video lúc này!</big>
              <br>
              <span>Hãy thử chuyển sang server khác.</span>
            </em>
          </p>
          `;
      });

      $content.innerHTML = '';
      $content.appendChild($video);
    }

    $video.src = src;
    $video.play();
  }

  function getVideo(host) {
    if (hostConfigs[host].src) {
      const $aActive = $tabs.querySelector('li.uk-active a');
      if ($aActive !== null && $aActive.dataset.host === host) return;

      renderVideo(hostConfigs[host].src);
      return;
    }

    if (host === 'upfileVn') {
      hostConfigs.upfileVn.data =
        'Token=' + sha256(hostConfigs.upfileVn.href.split('://')[1].split('/')[1] + '7891').toUpperCase();
    }

    GM.xmlHttpRequest({
      url: hostConfigs[host].href,
      method: hostConfigs[host].method || 'POST',
      headers: hostConfigs[host].headers,
      data: hostConfigs[host].data,

      onload: (response) => {
        let src = hostConfigs[host].getSrc(response.response);
        hostConfigs[host].src = src;
        renderVideo(src);
      },
    });
  }

  function playVideo(e) {
    e.preventDefault();
    e.stopPropagation();

    const $this = e.target,
      $active = $tabs.querySelector('li.uk-active');

    getVideo($this.dataset.host);

    if ($active !== null) $active.classList.remove('uk-active');
    $this.parentNode.classList.add('uk-active');
  }

  const hostConfigs = {
    upfileVn: {
      selector: 'a[href*="upfile.vn"]',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      getSrc: (response) => {
        return JSON.parse(response).Link;
      },
    },
    drivehub: {
      selector: 'a[href*="drivehub.link"]',
      method: 'GET',
      getSrc: (response) => {
        const parser = new DOMParser();
        const $html = parser.parseFromString(response, 'text/html');
        const $proceed = $html.querySelector('#proceed');

        return $proceed === null ? null : $proceed.href.replace(/\?e=download$/, '');
      },
    },
    upfileUs: {
      selector: 'a[href*="upfile.us"]',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      data: 'type=file_check',
      getSrc: (response) => {
        return JSON.parse(response).debug[0].file_source;
      },
    },
  };

  const $tabs = document.createElement('ul');
  $tabs.className = 'uk-subnav uk-subnav-pill';

  let hostCount = 0;
  Object.keys(hostConfigs).forEach((host) => {
    const currHost = hostConfigs[host];
    const $btn = document.querySelector('.uk-accordion-content ' + currHost.selector);
    if ($btn === null) return;
    hostConfigs[host].href = $btn.href;

    const li = document.createElement('li');
    const a = document.createElement('a');

    a.textContent = 'Server ' + ++hostCount;
    a.href = '#' + host;
    a.setAttribute('data-host', host);
    a.addEventListener('click', playVideo);

    li.appendChild(a);
    $tabs.appendChild(li);
  });

  const $contents = document.createElement('ul');
  $contents.className = 'uk-switcher uk-margin';

  const $content = document.createElement('li');
  $content.className = 'uk-active';
  $content.setAttribute(
    'style',
    `
      background: #000;
      border: 1px solid #6fb429;
      border-top: 0px solid #0000;
      box-sizing: border-box;
    `
  );
  $contents.appendChild($content);

  $videoWrap.appendChild($tabs);
  $videoWrap.appendChild($contents);

  $tabs.querySelector('a').click();
})();
