/* =================================================================
   OLD GAMER — Google Apps Script (Code.gs)
   =================================================================

   Деплой:
   1. Откройте таблицу → Расширения → Apps Script
   2. Вставьте этот код в редактор
   3. Укажите SPREADSHEET_ID ниже (из URL таблицы)
   4. Деплой → Новое развертывание → Тип: Веб-приложение
      · Выполнять как: Я (меня)
      · Доступ: Все
   5. Скопируйте URL развертывания → вставьте в script.js → APPS_SCRIPT_URL

   Telegram-уведомления (опционально):
   · Настройки проекта → Свойства скрипта → добавить:
     TELEGRAM_BOT_TOKEN = ваш_токен
     TELEGRAM_CHAT_ID   = ваш_chat_id

   Структура листов:
   · «Диски»  — id | title | platform | platformLabel | price |
                 release | meta | status | imageUrl | active
   · «Заявки» — создаётся автоматически при первой заявке

================================================================= */

// ── Настройки ─────────────────────────────────────────────────────

/** ID вашей Google Таблицы (из URL: /spreadsheets/d/ВОТ_ЭТО/edit) */
var SPREADSHEET_ID   = 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ_СЮДА';

var DISCS_SHEET_NAME  = 'Диски';
var ORDERS_SHEET_NAME = 'Заявки';

/** Заголовки листа «Заявки» — создаются автоматически */
var ORDERS_HEADERS = [
  'Дата', 'Игра', 'Платформа', 'Цена', 'Релиз',
  'Имя', 'Телефон', 'Telegram', 'Комментарий',
];

// ── GET: отдать список дисков ──────────────────────────────────────

/**
 * Обрабатывает GET-запрос.
 * Поддерживает параметр ?action=getDiscs (и по умолчанию тоже).
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getDiscs';

  try {
    if (action === 'getDiscs') {
      return getDiscsResponse();
    }
    return jsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

/**
 * Читает лист «Диски» и возвращает JSON-массив дисков.
 * Строки с active = FALSE (или пустым) отдаёт тоже — фильтрация на клиенте.
 */
function getDiscsResponse() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(DISCS_SHEET_NAME);

  if (!sheet) {
    return jsonResponse({ error: 'Лист «' + DISCS_SHEET_NAME + '» не найден' });
  }

  var data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return jsonResponse({ discs: [] });
  }

  var headers = data[0].map(function (h) { return String(h).trim(); });
  var rows    = data.slice(1);

  var discs = rows.map(function (row) {
    var disc = {};
    headers.forEach(function (header, i) {
      var val = row[i];
      // Привести boolean из Sheets к настоящему boolean
      if (header === 'active') {
        disc[header] = (val === true || String(val).toUpperCase() === 'TRUE');
      } else {
        disc[header] = (val === null || val === undefined) ? '' : val;
      }
    });
    return disc;
  });

  return jsonResponse({ discs: discs });
}

// ── POST: сохранить заявку ────────────────────────────────────────

/**
 * Обрабатывает POST-запрос с JSON-телом.
 * Записывает заявку в лист «Заявки» и отправляет Telegram-уведомление.
 */
function doPost(e) {
  try {
    var raw  = e && e.postData && e.postData.contents;
    var data = raw ? JSON.parse(raw) : {};

    saveOrder(data);
    sendTelegramNotification(data);

    return jsonResponse({ success: true });

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Записывает строку заявки в лист «Заявки».
 * Если лист не существует — создаёт его с заголовками.
 */
function saveOrder(data) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(ORDERS_SHEET_NAME);

  // Создать лист если его нет
  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_SHEET_NAME);
    sheet.appendRow(ORDERS_HEADERS);

    // Заморозить строку заголовков и выделить жирным
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, ORDERS_HEADERS.length)
         .setFontWeight('bold')
         .setBackground('#1a1a2e')
         .setFontColor('#ffffff');
  }

  // Дата в часовом поясе Новосибирска
  var now = Utilities.formatDate(
    new Date(),
    'Asia/Novosibirsk',
    'dd.MM.yyyy HH:mm:ss'
  );

  var phoneText = String(data.phone || '');

sheet.appendRow([
  now,
  data.name || '',
  '',
  data.tg || '',
  data.title || '',
  data.platform || '',
  data.note || ''
]);

var lastRow = sheet.getLastRow();
sheet.getRange(lastRow, 3).setNumberFormat('@');
sheet.getRange(lastRow, 3).setValue(phoneText);
}

// ── Telegram-уведомление ──────────────────────────────────────────

/**
 * Отправляет уведомление в Telegram.
 * Работает только если в свойствах скрипта указаны
 * TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 */
function sendTelegramNotification(data) {
  var props  = PropertiesService.getScriptProperties();
  var token  = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');

  if (!token || !chatId) {
    Logger.log('Telegram: токен или chat_id не указаны — уведомление пропущено');
    return;
  }

  var lines = [
    '🎮 <b>Новый предзаказ!</b>',
    '',
    '🕹 Игра: ' + (data.title         || '—'),
    '📺 Платформа: ' + (data.platformLabel || '—'),
    '💰 Цена: ' + (data.price         || '—'),
    '📅 Релиз: ' + (data.release       || '—'),
    '',
    '👤 Имя: '       + (data.name  || '—'),
    '📱 Телефон: '   + (data.phone || '—'),
    '💬 Telegram: '  + (data.tg    || '—'),
    '📝 Комментарий: ' + (data.note || '—'),
    '',
    '🕐 ' + Utilities.formatDate(new Date(), 'Asia/Novosibirsk', 'dd.MM.yyyy HH:mm'),
  ];

  var message = lines.join('\n');

  try {
    UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method:      'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          chat_id:    chatId,
          text:       message,
          parse_mode: 'HTML',
        }),
        muteHttpExceptions: true,
      }
    );
  } catch (err) {
    Logger.log('Telegram send error: ' + err.message);
  }
}

// ── Вспомогательная: JSON-ответ с CORS-заголовками ────────────────

function jsonResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── Тестовые функции (запускать вручную из редактора) ─────────────

/** Тест: показать первые 3 диска в логах */
function testGetDiscs() {
  var result = JSON.parse(getDiscsResponse().getContent());
  Logger.log('Всего дисков: ' + result.discs.length);
  Logger.log('Первые 3: ' + JSON.stringify(result.discs.slice(0, 3), null, 2));
}

/** Тест: записать тестовую заявку */
function testSaveOrder() {
  saveOrder({
    title:         'GTA VI',
    platformLabel: 'PlayStation 5',
    price:         '4 999 ₽',
    release:       'осень 2026',
    name:          'Тест',
    phone:         '+7 (999) 000-00-00',
    tg:            '@test',
    note:          'тестовая заявка',
  });
  Logger.log('Заявка записана');
}

/** Тест: отправить Telegram-уведомление */
function testTelegram() {
  sendTelegramNotification({
    title: 'Test Game', platformLabel: 'PS5',
    price: '1 000 ₽', release: '2026',
    name: 'Тест', phone: '+7 000', tg: '@test', note: '',
  });
  Logger.log('Telegram уведомление отправлено (если токен указан)');
}
