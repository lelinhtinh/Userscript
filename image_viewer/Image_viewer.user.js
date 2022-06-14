// ==UserScript==
// @name            Image Checkered Background
// @name:vi         Image viewer
// @namespace       http://devs.forumvi.com/
// @description     Use grid wallpaper to highlight transparent image. Support to view the large image by holding the right mouse and drag.
// @description:vi  Sử dụng nền lưới để làm nổi bật ảnh trong suốt. Hỗ trợ xem ảnh lớn bằng cách giữ và kéo chuột phải.
// @version         2.3.1
// @icon            https://i.imgur.com/5KKskys.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           *://*/*.apng
// @match           *://*/*.avif
// @match           *://*/*.gif
// @match           *://*/*.ico
// @match           *://*/*.jxl
// @match           *://*/*.png
// @match           *://*/*.svg
// @match           *://*/*.webp
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @inject-into     content
// ==/UserScript==

(function () {
  'use strict';

  /**
   * Background theme
   * @type {'system'|'dark'|'light'}
   */
  let theme = 'system';

  // Do not change the code below this line, unless you know how.
  if (document.contentType.indexOf('image/') !== 0) return;

  if (theme === 'system') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  let colorGrid = theme === 'light' ? ['#eee', 'white'] : ['gray', '#444'];

  function scrollByDragging(container, disableH, disableV) {
    function mouseUp(e) {
      if (e.which !== 3) return;

      window.removeEventListener('mousemove', mouseMove, true);
      container.style.cursor = 'default';
    }

    function mouseDown(e) {
      if (e.which !== 3) return;

      pos = {
        x: e.clientX,
        y: e.clientY,
      };

      window.addEventListener('mousemove', mouseMove, true);
      container.style.cursor = 'move';
    }

    function mouseMove(e) {
      if (!disableH) container.scrollLeft -= -pos.x + (pos.x = e.clientX);
      if (!disableV) container.scrollTop -= -pos.y + (pos.y = e.clientY);
    }

    let pos = {
      x: 0,
      y: 0,
    };

    container.oncontextmenu = function (e) {
      e.preventDefault();
    };

    container.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);
  }

  function updateImageInfo() {
    let img = document.querySelector('img');
    if (!img) return;

    let info = document.querySelector('.image-info');
    if (!info) {
      info = document.createElement('div');
      info.className = 'image-info';
      document.body.appendChild(info);
    }

    info.innerHTML = `
    <div class="image-info-title">
      <div class="image-info-ext">${imageInfo.ext.toUpperCase()}</div>
      <div class="image-info-size">${imageInfo.size}</div>
    </div>
    <div class="image-info-dimensions">${imageInfo.dimensions}</div>
    `;
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} <strong>${sizes[i]}</strong>`;
  }

  GM_addStyle(
    `html,body{width:100%;height:100%;margin:0;padding:0}
    body,svg:root{background-attachment:fixed!important;background-position:0 0, 10px 10px !important;background-size:20px 20px!important;background-image:linear-gradient(45deg, ${colorGrid[0]} 25%,transparent 25%, transparent 75%,${colorGrid[0]} 75%,${colorGrid[0]} 100%),linear-gradient(45deg, ${colorGrid[0]} 25%,${colorGrid[1]} 25%,${colorGrid[1]} 75%,${colorGrid[0]} 75%,${colorGrid[0]} 100%)!important;display:flex;align-content:center;justify-content:center}
    body > img{background-color:transparent!important;background-image:none!important;display:block;position:initial}
    body > img:hover{background:rgba(0,0,0,0.4)!important;outline:3px solid #333}
    body > img[style*="cursor: zoom-out;"],body > img.overflowing{position:relative!important}
    .image-info{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";color:#fff;background:#000000b8;text-align:center;text-shadow:1px 1px 2px #444,1px 1px 2px #444;border-radius:.2rem;padding:.4rem .7rem;width:fit-content;position:fixed;bottom:10%;left:50%;transform:translateX(-50%);opacity:1;transition:opacity 200ms;user-select:none}
    .image-info-title{display:flex;justify-content:space-evenly;flex-wrap:nowrap;gap:.5rem}
    .image-info:hover{opacity:0}
    .image-info-ext{font-weight:700}`,
  );

  if (document.contentType === 'image/svg+xml') return;

  scrollByDragging(document.documentElement);

  const imageInfo = {
    ext: '',
    size: '',
    dimensions: '',
  };

  let imageExt = document.contentType.split('/')[1];
  if (imageExt === 'svg+xml') imageExt = 'svg';
  if (imageExt === 'x-icon' || imageExt === 'vnd.microsoft.icon') imageExt = 'ico';
  imageInfo.ext = imageExt;

  let imageDimensions = document.title.match(/\(([A-Z]{3,4} Image,\s*)?\s*([0-9]+\s*(x|×)\s*[0-9]+)\s*(\pixels\s*)?/);
  if (imageDimensions) imageDimensions = imageDimensions[2];
  imageInfo.dimensions = imageDimensions;

  updateImageInfo();

  GM.xmlHttpRequest({
    method: 'GET',
    url: location.href,
    responseType: 'arraybuffer',
    onload: function (response) {
      imageInfo.dimensions = `${document.images[0].naturalWidth}×${document.images[0].naturalHeight}`;

      const imageSize = response.response.byteLength;
      imageInfo.size = formatBytes(imageSize);

      updateImageInfo();
    },
  });
})();
