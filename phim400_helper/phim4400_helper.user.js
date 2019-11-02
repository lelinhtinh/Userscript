// ==UserScript==
// @name            Phim4400 Helper
// @name:vi         Phim4400 Helper
// @namespace       https://lelinhtinh.github.io
// @description     Xem online và tải phim trực tiếp tại Phim4400, bỏ qua quảng cáo.
// @description:vi  Xem online và tải phim trực tiếp tại Phim4400, bỏ qua quảng cáo.
// @version         1.1.0
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
(function() {
  'use strict';

  const upfileVn = document.querySelector('a[href*="upfile.vn"]');
  const upfileUs = document.querySelector('a[href*="upfile.us"]');
  const drivehub = document.querySelector('a[href*="drivehub.link"]');

  let linkDown = {
    upfileVn: {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      getLink: response => {
        return JSON.parse(response).Link;
      },
    },
    drivehub: {
      method: 'GET',
      getLink: response => {
        let parser = new DOMParser();
        let html = parser.parseFromString(response, 'text/html');
        return html.getElementById('proceed').href;
      },
    },
    upfileUs: {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      data: 'type=file_check',
      getLink: response => {
        console.log(response);
        return JSON.parse(response).debug[0].file_source;
      },
    },
  };

  if (upfileVn !== null) {
    linkDown.upfileVn.url = upfileVn.href;
    linkDown.upfileVn.data = 'Token=' + sha256(upfileVn.href.split('://')[1].split('/')[1] + '7891').toUpperCase();
  }
  if (upfileUs !== null) linkDown.upfileUs.url = upfileUs.href;
  if (drivehub !== null) linkDown.drivehub.url = drivehub.href;

  let $videoFrame = document.createElement('video');
  $videoFrame.controls = true;
  $videoFrame.setAttribute('preload', 'auto');
  $videoFrame.setAttribute('width', '100%');
  const getVideo = type => {
    GM.xmlHttpRequest({
      url: linkDown[type].url,
      method: linkDown[type].method || 'POST',
      headers: linkDown[type].headers,
      data: linkDown[type].data,
      onload: response => {
        linkDown[type].link = linkDown[type].getLink(response.response);
        if ($videoFrame.canPlayType('video/mp4')) $videoFrame.setAttribute('src', linkDown[type].link);
        console.log(linkDown[type].link);
        if (document.getElementById('video-frame') !== null) {
          document.getElementById('video-frame').appendChild($videoFrame);
        }
      },
    });
  };
  let listServer = [];
  Object.keys(linkDown).forEach((btnSwitchServer, index) => {
    let serverLi = document.createElement('LI');
    let serverBtn = document.createElement('A');

    serverBtn.textContent = `SERVER ${index + 1}`;
    serverBtn.className = 'button-server';
    serverBtn.setAttribute('data-type', btnSwitchServer);
    serverLi.appendChild(serverBtn);
    listServer.push(serverLi);
  });

  let $listViewBtn = document.querySelector('.uk-accordion');

  if ($listViewBtn !== null) {
    let $videoTemplate = `<ul class="uk-subnav uk-subnav-pill" uk-switcher></ul>
      <ul class="uk-switcher uk-margin">
        <li id="video-frame"></li>
      </ul>
    `;
    let $videoFrame = document.querySelector('.xem-phim.uk-panel');
    if (document.querySelector('.xem-phim.uk-panel > ul') === null) {
      $videoFrame.insertAdjacentHTML('beforeend', $videoTemplate);
      let navSelectServer = document.querySelector('.uk-subnav.uk-subnav-pill');
      listServer.forEach(sv => {
        navSelectServer.appendChild(sv);
      });
    }
    getVideo('upfileVn');
    $listViewBtn.addEventListener('click', e => {
      e.preventDefault();
      if (e.target.classList.contains('button-server')) {
        getVideo(e.target.dataset.type);
      }
    });
  }

  //
  document.oncontextmenu = null;
  if (shortcut) {
    shortcut.remove('Ctrl+U');
    shortcut.remove('F12');
    shortcut.remove('Ctrl+Shift+I');
    shortcut.remove('Ctrl+S');
    shortcut.remove('Ctrl+Shift+C');
  }

  let $btn = document.querySelector('.button-phim'),
    link = document.querySelector('.fb-comments');

  if (link === null) return;
  link = link.dataset.href;
  if (link.indexOf('/phim/') === -1) return;

  if ($btn === null) {
    $btn = document.createElement('A');
    $btn.textContent = 'Tải Phim VIP';
    document.querySelector('.button-info').appendChild($btn);
  }

  $btn.className = 'button-phim uk-button uk-button-secondary uk-dropdown-right';
  $btn.setAttribute('target', '_top');

  $btn.href = link;
})();
