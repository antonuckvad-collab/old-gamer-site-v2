import { defineConfig } from "tinacms";

// Ветка берётся из env — обязательно добавь NEXT_PUBLIC_TINA_BRANCH=main на Vercel
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const PLATFORM_OPTIONS = [
  { value: "ps5", label: "PlayStation 5" },
  { value: "ps4", label: "PlayStation 4" },
  { value: "ps3", label: "PlayStation 3" },
  { value: "ps2", label: "PlayStation 2" },
  { value: "xbox", label: "Xbox Series X|S" },
  { value: "xboxone", label: "Xbox One" },
  { value: "switch", label: "Nintendo Switch" },
  { value: "switch2", label: "Nintendo Switch 2" },
  { value: "pc", label: "PC / Steam" },
];

export default defineConfig({
  branch,

  // clientId и token — берутся из env-переменных
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID ?? "",
  token: process.env.TINA_TOKEN ?? "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      // ─── Настройки сайта ────────────────────────────────────────
      {
        name: "settings",
        label: "⚙️ Настройки сайта",
        path: "content/settings",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        match: { include: "site" },
        fields: [
          { type: "string", name: "phone", label: "Телефон", required: true },
          { type: "string", name: "tg_orders", label: "Telegram для заказов (URL)" },
          { type: "string", name: "tg_channel", label: "Telegram канал (URL)" },
          { type: "string", name: "avito_url", label: "Ссылка на Авито" },
          { type: "string", name: "address", label: "Адрес магазина", ui: { component: "textarea" } },
          { type: "string", name: "hours_label", label: "Часы работы", description: "Например: 10:00 — 21:00" },
          { type: "number", name: "hours_open", label: "Час открытия (число, 0-23)" },
          { type: "number", name: "hours_close", label: "Час закрытия (число, 0-23)" },
          {
            type: "object",
            name: "hero",
            label: "Главный блок (Hero)",
            fields: [
              { type: "string", name: "eyebrow", label: "Подпись над заголовком" },
              { type: "string", name: "title", label: "Заголовок", ui: { component: "textarea" } },
              { type: "string", name: "lead", label: "Описание", ui: { component: "textarea" } },
            ],
          },
          {
            type: "object",
            name: "stats",
            label: "Статистика в hero",
            list: true,
            fields: [
              { type: "string", name: "number", label: "Цифра (50+, 3 мес)" },
              { type: "string", name: "label", label: "Подпись" },
            ],
          },
          {
            type: "object",
            name: "tradein_prices",
            label: "Калькулятор трейд-ин (₽)",
            fields: [
              { type: "number", name: "ps5", label: "PlayStation 5 Slim" },
              { type: "number", name: "ps4", label: "PlayStation 4 Pro" },
              { type: "number", name: "xboxsx", label: "Xbox Series X" },
              { type: "number", name: "switch", label: "Switch OLED" },
              { type: "number", name: "ps3", label: "PlayStation 3" },
            ],
          },
          {
            type: "image",
            name: "shop_photos",
            label: "Фото магазина (слайдер)",
            list: true,
          },
        ],
      },

      // ─── Предзаказы / Диски ─────────────────────────────────────
      {
        name: "disc",
        label: "🎮 Предзаказы (диски)",
        path: "content/disks",
        format: "json",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Название игры",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "platform",
            label: "Платформа",
            required: true,
            options: PLATFORM_OPTIONS,
            description: "Код платформы — от него зависит цвет полоски и фильтр-таб на сайте",
          },
          {
            type: "string",
            name: "price",
            label: "Цена",
            description: "Например: 4 999 ₽",
          },
          {
            type: "string",
            name: "release",
            label: "Статус / дата релиза",
            description: "Релиз: осень 2026 или: В наличии · 3 шт.",
          },
          {
            type: "string",
            name: "status",
            label: "Статус карточки",
            options: [
              { value: "preorder", label: "Предзаказ" },
              { value: "stock", label: "В наличии" },
            ],
          },
          {
            type: "string",
            name: "meta",
            label: "Жанр / студия",
            description: "Action · Open World · Rockstar",
          },
          {
            type: "image",
            name: "image",
            label: "Обложка игры",
            description: "Рекомендуемый размер: 600×800px, JPG/PNG, до 300KB",
          },
          {
            type: "boolean",
            name: "active",
            label: "Показывать на сайте",
          },
          {
            type: "number",
            name: "order",
            label: "Порядок (меньше = выше в списке)",
          },
        ],
      },

      // ─── Услуги ──────────────────────────────────────────────────
      {
        name: "service",
        label: "🛠 Услуги",
        path: "content/services",
        format: "json",
        fields: [
          { type: "string", name: "title", label: "Название", isTitle: true, required: true },
          { type: "string", name: "description", label: "Описание", ui: { component: "textarea" } },
          { type: "string", name: "cta_label", label: "Текст ссылки" },
          { type: "string", name: "cta_url", label: "Куда ведёт ссылка" },
          { type: "number", name: "order", label: "Порядок (1-4)" },
        ],
      },

      // ─── Категории каталога ──────────────────────────────────────
      {
        name: "category",
        label: "📦 Категории каталога",
        path: "content/categories",
        format: "json",
        fields: [
          { type: "string", name: "title", label: "Название", isTitle: true, required: true },
          { type: "string", name: "count", label: "Подпись с количеством", description: "50+ консолей" },
          { type: "string", name: "badge", label: "Бейдж (Хит / Новинка)" },
          { type: "string", name: "url", label: "Ссылка" },
          { type: "image", name: "image", label: "Картинка" },
          { type: "number", name: "order", label: "Порядок" },
        ],
      },
    ],
  },
});
