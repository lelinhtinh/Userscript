// ==UserScript==
// @name            CF Gift Code
// @name:vi         Gift Code CF
// @namespace       https://lelinhtinh.github.io
// @description     Auto enter Crossfire Gift Code.
// @description:vi  Tự động nhập Gift Code Đột Kích.
// @version         1.2.0
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
  console.log('Giftcode', gc);

  $gcInput.val(gc);
  $gcInput.trigger('focus');

  if (/\(.+?\)/.test(gc)) {
    const beginRange = gc.search(/\s?\(/);
    let endRange = gc.search(/\)\s/);
    endRange = endRange === -1 ? gc.search(/\)/) + 1 : endRange + 2;
    $gcInput.get(0).setSelectionRange(beginRange, endRange);
    return;
  }

  sendGiftcode(gc);
}

function sendGiftcode(gc) {
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

function onSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  sendGiftcode($gcInput.val());
}

function validateClipboard(clipText) {
  if (!clipText) return;
  const gcPattern = /\bCFS?[A-Z0-9]{2,}(\s?\(.+?\)\s?)?([A-Z0-9]+)?(\b|\B)/;

  gcClipboard = clipText
    .split('\n')
    .map((gc) => gc.trim())
    .filter((gc) => gc && gcPattern.test(gc))
    .map((gc) => {
      gc = gc.match(gcPattern)[0];
      const mathPattern = /\s?\(([0-9+\-*/x:]{2,}[0-9]+)=\?\)\s?/;
      if (mathPattern.test(gc)) {
        return gc.replace(mathPattern, (m) => {
          let expression = m.match(mathPattern)[1];
          expression = expression.replaceAll('x', '*').replaceAll(':', '/');
          return eval(expression);
        });
      }
      return gc;
    });

  if (!gcClipboard.length) {
    $helpText.removeClass('text-muted').addClass('text-danger').text('Clipboard không có Gift Code');
    return;
  }

  autoGiftcode();
}

let gcClipboard = [];

const $gcAutoBtn = $('<button />', {
  type: 'button',
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
const $gcSubmit = $('.btn-accept');

const userInfo = $('#navbarCollapse').find('[href="https://goplay.vn/"]').text().split(/:|-/);
const userName = userInfo[1].trim();
const userId = userInfo[3].trim();
console.log(userName, userId);

$gcForm.append($helpText);
$gcAutoBtn.insertBefore($gcInput);

$gcAutoBtn.on('click', (e) => {
  e.preventDefault();

  $helpText.removeClass('text-danger').addClass('text-muted').empty();
  navigator.clipboard.readText().then((clipText) => validateClipboard(clipText));
});

$gcInput.on('keydown', (e) => {
  if (e.which !== 13) return;
  onSubmit(e);
});
$gcSubmit.on('click', onSubmit);
$gcForm.on('submit', onSubmit);
