// ==UserScript==
// @name            Vozer downloader
// @namespace       https://lelinhtinh.github.io/
// @description     Tải truyện từ Vozer định dạng EPUB.
// @version         1.0.0
// @icon            https://raw.githubusercontent.com/lelinhtinh/Userscript/refs/heads/master/vozer_downloader/icon.jpg
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://lelinhtinh.mit-license.org/license.txt
// @match           https://vozer.io/*
// @require         https://code.jquery.com/jquery-3.7.1.min.js
// @require         https://unpkg.com/jszip@3.9.1/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js
// @require         https://unpkg.com/ejs@3.1.10/ejs.min.js
// @require         https://unpkg.com/jepub@2.5.0/dist/jepub.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         *
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==

(function ($, window, document) {
  'use strict';

  // ===== SETTINGS =====
  const settings = {
    errorAlert: false,
    allowedImageExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  };

  // ===== UTILITY FUNCTIONS =====
  const chunkArray = (arr, per) => {
    return arr.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / per);
      if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
      resultArray[chunkIndex].push(item);
      return resultArray;
    }, []);
  };

  const cleanHtml = (str) => {
    str = str.replace(/\s*Chương\s*\d+\s?:[^<\n]/, '');
    str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
    return '<div>' + str + '</div>';
  };

  const beforeleaving = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };

  const shouldSkipImage = (imageUrl) => {
    const urlExtension = imageUrl.match(/\.(\w+)(\?|#|$)/i);
    const extension = urlExtension ? urlExtension[1].toLowerCase() : null;
    // Skip images with unsupported extensions
    return !extension || !settings.allowedImageExtensions.includes(extension);
  };
  const processSingleImage = async (imgElement, imgSrc, imageIndex, totalImages) => {
    if (!imgSrc) {
      imgElement.remove();
      return;
    }

    try {
      const absoluteUrl = new URL(imgSrc, locationInfo.referrer).href;

      if (shouldSkipImage(absoluteUrl)) {
        console.log(`Bỏ qua ảnh có định dạng không hỗ trợ: ${absoluteUrl}`);
        imgElement.remove();
        return;
      }

      console.log(`Đang tải ảnh ${imageIndex + 1}/${totalImages}: ${absoluteUrl}`);

      const chapId = chapterState.current.link.replace(/\W+/g, '_');
      const imageId = await downloadAndAddImage(absoluteUrl, `chap_${chapId}_img_${imageIndex}`);
      imgElement.replaceWith(`<p><%= image['${imageId}'] %></p>`); // Delay between images to avoid rate limiting
      if (imageIndex < totalImages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.warn('Không thể tải ảnh:', imgSrc, error);
      imgElement.replaceWith('<p><a href="' + imgSrc + '">Click để xem ảnh</a></p>');
    }
  };

  const processChapterImages = async ($chapter) => {
    const $images = $chapter.find('img');
    if (!$images.length) return;

    // Process each image sequentially
    for (let i = 0; i < $images.length; i++) {
      await processSingleImage($images.eq(i), $images.eq(i).attr('src'), i, $images.length);
    }
  };

  const cleanChapterContent = ($chapter) => {
    // Remove unwanted elements
    const $unwantedElements = $chapter.find('script, style, a');
    const $hiddenElements = $chapter.find('[style]').filter(function () {
      return this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white';
    });
    const $textNodes = $chapter.contents().filter(function () {
      return this.nodeType === 3 && this.nodeValue.trim() !== '';
    });

    $unwantedElements.remove();
    $hiddenElements.remove();
    $textNodes.remove();

    return $chapter.text().trim() !== '' ? cleanHtml($chapter.html()) : null;
  };

  const extractChapterTitle = ($data) => {
    let title = $data.find('h1').text().trim();
    if (!title) {
      const chapterMatch = chapterState.current.link.match(/\d+/);
      title = chapterMatch ? `Chương ${chapterMatch[0]}` : 'Chương không xác định';
    }
    return title;
  };

  const updateDownloadProgress = () => {
    const progressText = `Đang tải <strong>${chapterState.current.index}/${chapterState.size}${
      partState.size ? '/' + (partState.current + 1) : ''
    }</strong>`;
    ui.$download.html(progressText);
    document.title = `[${chapterState.current.index}] ${ui.pageName}`;
    console.log(`Đã tải: ${chapterState.current.index}/${chapterState.size} - ${chapterState.current.title}`);
  };

  const downloadAndAddImage = async (imgUrl, imageId) => {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: 'GET',
        url: imgUrl,
        responseType: 'arraybuffer',
        timeout: 15000, // 15 second timeout
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Referer: locationInfo.referrer,
        },
        onload: (response) => {
          try {
            if (response.status === 200 && response.response && response.response.byteLength > 0) {
              libs.jepub.image(response.response, imageId);
              console.log(`Đã tải thành công ảnh: ${imageId} (${Math.round(response.response.byteLength / 1024)}KB)`);
              resolve(imageId);
            } else {
              reject(new Error(`HTTP ${response.status} hoặc ảnh rỗng`));
            }
          } catch (error) {
            reject(error);
          }
        },
        onerror: (error) => {
          reject(new Error('Lỗi mạng khi tải ảnh'));
        },
        ontimeout: () => {
          reject(new Error('Timeout khi tải ảnh'));
        },
      });
    });
  };

  // ===== GLOBAL STATE OBJECTS =====

  // URL and Location Information
  const locationInfo = {
    host: location.host,
    pathname: location.pathname,
    referrer: location.protocol + '//' + location.host + location.pathname,
    novelAlias: location.pathname.slice(1, -1),
  };

  // Ebook Metadata
  const ebookInfo = {
    title: $('h1').text().trim(),
    author: null,
    cover: null,
    description: null,
    genres: [],
    credits: `<p>Truyện được tải từ <a href="${locationInfo.referrer}">Vozer</a></p><p>Userscript được viết bởi: <a href="https://lelinhtinh.github.io/jEpub/">lelinhtinh</a></p>`,
  };

  // Chapter Management
  const chapterState = {
    list: [],
    size: 0,
    current: {
      link: '',
      title: '',
      index: 0,
    },
    progress: {
      begin: '',
      end: '',
      summary: '',
    },
  };

  // Part Management (for splitting large books)
  const partState = {
    list: [],
    size: 0,
    current: 0,
  };

  // Download State
  const downloadState = {
    status: '',
    isFinished: false,
    hasErrors: false,
    delay: 0,
    errorTitles: [],
  };

  // UI Elements
  const ui = {
    pageName: document.title,
    $download: $('<a>', {
      class: 'pt-1.5 pb-1 px-2 ml-4 leading-normal font-semibold text-white rounded bg-blue-001',
      href: '#download',
      text: 'Tải xuống',
    }),
    $description: $('#chapter_001 > .font-content.smiley'),
  };

  // External Libraries
  const libs = {
    jepub: null,
  };

  // Helper function for download status
  const downloadStatus = (label) => {
    const labelStatus = {
      primary: 'bg-blue-001',
      success: 'bg-green-001',
      danger: 'bg-red-001',
      warning: 'bg-yellow-600',
    };
    downloadState.status = label;
    ui.$download
      .removeClass('bg-blue-001 bg-green-001 bg-red-001 bg-yellow-600')
      .addClass(labelStatus[label] || 'bg-blue-001');
  };

  // ===== MAIN FUNCTIONS =====
  const downloadError = (message, error, isServerError) => {
    downloadStatus('danger');

    handleErrorAlert(message);
    if (error) console.error(message, error);

    if (isServerError) {
      return handleServerError();
    }

    return handleChapterContentError(message);
  };

  const handleErrorAlert = (message) => {
    if (settings.errorAlert) {
      settings.errorAlert = confirm(`Lỗi! ${message}\nBạn có muốn tiếp tục nhận cảnh báo?`);
    }
  };

  const handleServerError = () => {
    if (downloadState.delay > 700) {
      if (chapterState.current.title) downloadState.errorTitles.push(chapterState.current.title);
      console.warn('Dừng tải do quá nhiều lỗi kết nối');
      return;
    }

    downloadStatus('warning');
    downloadState.delay += 100;
    retryGetContent();
  };

  const retryGetContent = () => {
    setTimeout(async () => {
      try {
        await getContent();
      } catch (error) {
        console.error('Lỗi trong retry getContent:', error);
      }
    }, downloadState.delay);
  };

  const handleChapterContentError = (message) => {
    if (!chapterState.current.title) return;

    downloadState.errorTitles.push(chapterState.current.title);
    return `<p class="no-indent"><a href="${chapterState.current.link}">${message}</a></p>`;
  };

  const genEbook = async () => {
    try {
      const epubZipContent = await libs.jepub.generate('blob', (metadata) => {
        ui.$download.html('Đang nén <strong>' + metadata.percent.toFixed(2) + '%</strong>');
      });

      document.title = '[⇓] ' + ebookInfo.title;
      window.removeEventListener('beforeunload', beforeleaving);
      const ebookFilename = locationInfo.novelAlias + (partState.size ? '-p' + (partState.current + 1) : '') + '.epub';

      ui.$download
        .attr({
          href: window.URL.createObjectURL(epubZipContent),
          download: ebookFilename,
        })
        .text('Hoàn thành')
        .off('click');
      if (downloadState.status !== 'danger') downloadStatus('success');

      saveAs(epubZipContent, ebookFilename);
      setTimeout(async () => {
        await checkPart();
      }, 2000);
    } catch (err) {
      downloadStatus('danger');
      console.error('Lỗi khi tạo EPUB:', err);
      ui.$download.text('Lỗi tạo EPUB');
    }
  };

  const checkPart = async () => {
    if (partState.current >= partState.size) return;
    partState.current++;
    chapterState.list = partState.list[partState.current];
    chapterState.size = chapterState.list.length;

    // Reset chapter state for new part
    chapterState.current.link = '';
    chapterState.current.title = '';
    chapterState.current.index = 0;
    chapterState.progress.begin = '';
    chapterState.progress.end = '';
    downloadState.isFinished = false;

    await init();
  };

  const saveEbook = async () => {
    if (downloadState.isFinished) {
      console.warn('saveEbook đã được gọi, bỏ qua duplicate call');
      return;
    }
    downloadState.isFinished = true;
    ui.$download.html('Bắt đầu tạo EPUB');
    console.log('Bắt đầu tạo EPUB...');

    let titleErrorHtml = '';
    if (downloadState.errorTitles.length) {
      titleErrorHtml =
        '<p class="no-indent"><strong>Các chương lỗi: </strong>' + downloadState.errorTitles.join(', ') + '</p>';
    }
    chapterState.progress.summary =
      '<p class="no-indent">Nội dung từ <strong>' +
      chapterState.progress.begin +
      '</strong> đến <strong>' +
      chapterState.progress.end +
      '</strong></p>';

    libs.jepub.notes(chapterState.progress.summary + titleErrorHtml + '<br /><br />' + ebookInfo.credits);

    try {
      const response = await new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
          method: 'GET',
          url: ebookInfo.cover,
          responseType: 'arraybuffer',
          onload: resolve,
          onerror: reject,
        });
      });

      try {
        libs.jepub.cover(response.response);
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error('Lỗi khi tải cover:', err);
    }
    await genEbook();
  };

  const getContent = async () => {
    if (downloadState.isFinished) return;

    chapterState.current.link = chapterState.list[chapterState.current.index];

    try {
      const response = await $.get(chapterState.current.link);
      const $data = $(response);

      if (downloadState.isFinished) return;

      chapterState.current.title = extractChapterTitle($data);
      let chapContent = await processChapterContent($data);

      libs.jepub.add(chapterState.current.title, chapContent);
      updateChapterProgress();

      if (await shouldFinishDownload()) {
        await saveEbook();
      } else {
        scheduleNextChapter();
      }
    } catch (err) {
      handleChapterError(err);
    }
  };

  const processChapterContent = async ($data) => {
    const $chapter = $data.find('#content');

    if (!$chapter.length) {
      return downloadError('Không có nội dung');
    }

    await processChapterImages($chapter);
    const cleanedContent = cleanChapterContent($chapter);

    if (!cleanedContent) {
      return downloadError('Nội dung không có');
    }

    if (downloadState.status !== 'danger') downloadStatus('warning');
    return cleanedContent;
  };

  const updateChapterProgress = () => {
    if (chapterState.current.index === 0) chapterState.progress.begin = chapterState.current.title;
    chapterState.progress.end = chapterState.current.title;
    chapterState.current.index++;
    updateDownloadProgress();
  };

  const shouldFinishDownload = async () => {
    const isComplete = chapterState.current.index >= chapterState.size;
    if (isComplete) {
      console.log('Hoàn thành tải tất cả chương, bắt đầu tạo EPUB...');
    }
    return isComplete;
  };

  const scheduleNextChapter = () => {
    setTimeout(async () => {
      try {
        await getContent();
      } catch (error) {
        console.error('Lỗi trong setTimeout getContent:', error);
        downloadError('Lỗi không mong muốn', error, true);
      }
    }, downloadState.delay);
  };

  const handleChapterError = (err) => {
    console.error('Lỗi khi tải chương:', err);
    chapterState.current.title = null;

    if (!downloadState.isFinished) {
      downloadError('Kết nối không ổn định', err, true);
    }
  };

  const customDownload = () => {
    const shouldSplitEbook = confirm('Chọn "OK" nếu muốn chia nhỏ ebook');

    if (shouldSplitEbook) {
      handleEbookSplitting();
    } else {
      handleCustomStartChapter();
    }
  };

  const handleEbookSplitting = () => {
    const shouldSplitByChapterCount = confirm('Chọn "OK" nếu muốn chia theo số lượng chương');

    let chaptersPerPart;
    if (shouldSplitByChapterCount) {
      chaptersPerPart = getChaptersPerPart();
    } else {
      chaptersPerPart = getChaptersPerPartByPartCount();
    }

    if (chaptersPerPart > 0) {
      splitChapterList(chaptersPerPart);
    }
  };

  const getChaptersPerPart = () => {
    const input = prompt('Nhập số lượng chương mỗi phần:', 2000);
    return parseInt(input, 10) || 0;
  };

  const getChaptersPerPartByPartCount = () => {
    const input = prompt('Nhập số phần muốn chia nhỏ:', 3);
    const partCount = parseInt(input, 10);
    return partCount > 0 ? Math.floor(chapterState.size / partCount) : 0;
  };

  const splitChapterList = (chaptersPerPart) => {
    partState.list = chunkArray(chapterState.list, chaptersPerPart);
    partState.size = partState.list.length;
    chapterState.list = partState.list[partState.current];
    chapterState.size = chapterState.list.length;
  };

  const handleCustomStartChapter = () => {
    const startChapterId = prompt('Nhập ID chương truyện bắt đầu tải:', chapterState.list[0]);
    const startIndex = chapterState.list.indexOf(startChapterId);

    if (startIndex !== -1) {
      chapterState.list = chapterState.list.slice(startIndex);
      chapterState.size = chapterState.list.length;
    }
  };

  const crawlChapterList = async ($document = $(document), chapterLinks = []) => {
    const $chapterLinks = $document.find('td.text-blue-001 > a');
    if (!$chapterLinks.length) return chapterLinks;
    chapterLinks.push(...$chapterLinks.map((_, link) => $(link).attr('href').trim()));

    const $nextPage = $document.find('[rel="next"]');
    if ($nextPage.length) {
      const nextPageUrl = $nextPage.attr('href').trim();
      console.log('Đang tải danh sách chương:', nextPageUrl);

      const nextPageData = await $.get(nextPageUrl);
      return crawlChapterList($(nextPageData), chapterLinks);
    }
    return chapterLinks;
  };

  const init = async () => {
    if (!chapterState.size) return;
    libs.jepub = new jEpub();
    libs.jepub
      .init({
        title: ebookInfo.title,
        author: ebookInfo.author,
        publisher: locationInfo.host,
        description: ebookInfo.description,
        tags: ebookInfo.genres,
      })
      .uuid(locationInfo.referrer + (partState.size ? '#p' + (partState.current + 1) : ''));

    window.addEventListener('beforeunload', beforeleaving);

    ui.$download.one('click', async (e) => {
      e.preventDefault();
      await saveEbook();
    });

    await getContent();
  };

  // ===== EXECUTION =====
  if (!ui.$description.length) return;

  const $bookData = $('#chapter_001').prev('script');
  if (!$bookData.length) return;
  let bookData = JSON.parse($bookData.text().trim());
  bookData = bookData['@graph']?.find((i) => i['@type'] === 'Book');
  if (!bookData) return;
  ebookInfo.author = bookData.author?.name || null;
  ebookInfo.cover = bookData.image || null;
  ebookInfo.description = ui.$description.html().trim() || null;
  ebookInfo.genres = [bookData.genre || null];

  $('#chapter_001 > div.border > div.text-justify > div').append(ui.$download);
  ui.$download.one('click contextmenu', async (e) => {
    e.preventDefault();
    document.title = '[...] Vui lòng chờ trong giây lát';

    try {
      chapterState.list = await crawlChapterList();
      chapterState.size = chapterState.list.length;

      if (e.type === 'contextmenu') {
        ui.$download.off('click');
        customDownload();
      } else {
        ui.$download.off('contextmenu');
      }

      await init();
    } catch (jqXHR) {
      downloadError(jqXHR.statusText || 'Lỗi tải danh sách chương');
    }
  });
})(jQuery, window, document);
