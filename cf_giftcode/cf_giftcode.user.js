// ==UserScript==
// @name            CF Gift Code
// @name:vi         Gift Code CF
// @namespace       https://lelinhtinh.github.io
// @description     Auto enter Crossfire Gift Code.
// @description:vi  Tự động nhập Gift Code Đột Kích.
// @version         1.0.0
// @icon            https://i.imgur.com/ga9bS6c.png
// @author          lelinhtinh
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://dotkich.goplay.vn/shop/giftcode
// @noframes
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-idle
// @grant           none
// ==/UserScript==

function autoGiftcode() {
  if (!gcClipboard.length) return;
  const gc = gcClipboard.pop();
  console.log(gc);

  $.ajax({
    url: '/api/ajaxapi/GiftCode/CheckCode',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    processData: true,
    cache: false,
    data: JSON.stringify({
      GiftCode: gc,
      ServiceCode: 'CF',
      UserId: userId,
      UserName: userName,
    }),
  })
    .done((data) => {
      $helpText.append(`${gc}: ${data.message}\n`);
    })
    .always(autoGiftcode);
}

function validateClipboard(clipText) {
  if (!clipText) return;

  gcClipboard = clipText
    .split('\n')
    .map((gc) => gc.trim())
    .filter((gc) => gc && /^CF[0-9A-Z]+$/.test(gc));

  if (!gcClipboard.length) {
    $helpText.removeClass('text-muted').addClass('text-danger').text('Clipboard không có Gift Code');
    return;
  }

  autoGiftcode();
}

let gcClipboard = [];

const $gcAutoBtn = $('<button />', {
  id: 'btn_giftcode_auto',
  class: 'btn btn-lg btn-primary btn-block mb-4',
  text: 'Tự động nhập từ bộ nhớ đệm',
});

const $helpText = $('<pre />', {
  id: 'alert_giftcode_auto',
  class: 'form-text text-muted small',
});

const $gcInput = $('#input_giftcode');
const $gcForm = $('.bx-giftcode');

const userInfo = $('#navbarCollapse').find('[href="https://goplay.vn/"]').text().split(/:|-/);
const userName = userInfo[1].trim();
const userId = userInfo[3].trim();
console.log(userName, userId);

$gcForm.append($helpText);
$gcAutoBtn.insertBefore($gcInput);

$gcAutoBtn.click((e) => {
  e.preventDefault();

  $helpText.removeClass('text-danger').addClass('text-muted').empty();
  navigator.clipboard.readText().then((clipText) => validateClipboard(clipText));
});
