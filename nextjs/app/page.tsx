import fs from "fs";
import path from "path";

type Settings = {
  phone: string;
  tg_orders: string;
  tg_channel: string;
  avito_url: string;
  address: string;
  hours_label: string;
  hero: { eyebrow: string; title: string; lead: string };
  stats: { number: string; label: string }[];
  tradein_prices: Record<string, number>;
  shop_photos: string[];
};

type Disc = {
  title: string;
  platform: string;
  price: string;
  release: string;
  status: "preorder" | "stock";
  meta: string;
  image?: string;
  active: boolean;
  order: number;
};

// Загружаем контент напрямую из JSON-файлов (работает без Tina-клиента).
// После полной настройки Tina перейдите на client.queries.* для live preview.
function loadSettings(): Settings {
  const file = path.join(process.cwd(), "content/settings/site.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function loadDiscs(): Disc[] {
  const dir = path.join(process.cwd(), "content/disks");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as Disc)
    .filter((d) => d.active)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
}

const PLATFORM_CONFIG: Record<string, { label: string; short: string; bg: string }> = {
  ps5:     { label: "PlayStation 5",     short: "PS5",  bg: "linear-gradient(90deg,rgba(0,55,145,.88),rgba(0,112,209,.88))" },
  ps4:     { label: "PlayStation 4",     short: "PS4",  bg: "linear-gradient(90deg,rgba(0,48,135,.9),rgba(0,75,160,.9))" },
  ps3:     { label: "PlayStation 3",     short: "PS3",  bg: "linear-gradient(90deg,rgba(20,25,80,.9),rgba(40,50,130,.9))" },
  ps2:     { label: "PlayStation 2",     short: "PS2",  bg: "linear-gradient(90deg,rgba(0,30,100,.9),rgba(0,50,130,.9))" },
  xbox:    { label: "Xbox Series X|S",   short: "XSX",  bg: "linear-gradient(90deg,rgba(14,92,14,.9),rgba(16,124,16,.9))" },
  xboxone: { label: "Xbox One",          short: "ONE",  bg: "linear-gradient(90deg,rgba(0,80,0,.9),rgba(0,110,0,.9))" },
  switch:  { label: "Nintendo Switch",   short: "NSW",  bg: "linear-gradient(90deg,rgba(162,0,17,.9),rgba(220,0,18,.9))" },
  switch2: { label: "Nintendo Switch 2", short: "NSW2", bg: "linear-gradient(90deg,rgba(100,0,60,.9),rgba(170,0,80,.9))" },
  pc:      { label: "PC / Steam",        short: "PC",   bg: "linear-gradient(90deg,rgba(80,0,140,.9),rgba(110,0,180,.9))" },
};

export default function HomePage() {
  const s = loadSettings();
  const discs = loadDiscs();

  return (
    <main>
      {/* Top strip */}
      <div className="topstrip">
        <div className="wrap">
          <div className="pulse"><i style={{ background: "#42D17A", boxShadow: "0 0 8px #42D17A" }} /><span>Магазин · ТРЦ Континент · 3 этаж</span></div>
          <div className="right">
            <span className="hide-sm">Пн–Вс · {s.hours_label}</span>
            <a href={`tel:${s.phone.replace(/\D/g, "")}`}>{s.phone}</a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg"><div className="grid"></div></div>
        <div>
          <div className="hero-eyebrow"><b>●</b> {s.hero.eyebrow}</div>
          <h1>{s.hero.title}</h1>
          <p className="lead">{s.hero.lead}</p>
          <div className="cta-row">
            <a className="btn btn-primary" href={s.avito_url} target="_blank" rel="noopener">Смотреть каталог</a>
            <a className="btn btn-ghost" href={s.tg_orders} target="_blank" rel="noopener">Написать в Telegram</a>
          </div>
          <div className="hero-stats">
            {s.stats.map((stat, i) => (
              <div key={i} className="item">
                <div className="n">{stat.number}</div>
                <div className="l">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preorder (минимальный пример) */}
      <section className="s" id="preorder">
        <div className="s-head">
          <div className="l">
            <div className="num">03 — Предзаказ</div>
            <h2>Закажи диск <span className="y">до релиза</span></h2>
          </div>
        </div>
        <div className="disc-grid">
          {discs.map((d, i) => {
            const cfg = PLATFORM_CONFIG[d.platform] || { label: d.platform, short: d.platform.toUpperCase(), bg: "rgba(0,0,0,.7)" };
            return (
              <article key={i} className="disc-card" data-platform={d.platform} data-status={d.status}>
                <div className="cover" style={{ background: d.image ? `url(${d.image}) center/cover` : "linear-gradient(160deg,#1A2230,#0E141C)" }}>
                  <div className="platform-strip" style={{ background: cfg.bg }}>
                    {cfg.label}<span>{cfg.short}</span>
                  </div>
                  <div className={`status-tag ${d.status}`}>{d.status === "preorder" ? "Предзаказ" : "В наличии"}</div>
                </div>
                <div className="info">
                  <h4>{d.title}</h4>
                  <div className="meta">{d.meta}</div>
                  <div className="ftr">
                    <div className="price">{d.price}</div>
                    <button className="btn btn-primary preorder-btn">Предзаказ →</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* TODO: остальные секции (Каталог, Услуги, Трейд-ин, Ремонт, Локация, Telegram CTA, Footer) — конвертировать из OLD GAMER.html постепенно */}

      <footer>
        <div className="wrap">
          <div>
            <p className="tag">{s.address}</p>
            <p className="tag" style={{ marginTop: 12 }}>{s.phone}</p>
          </div>
        </div>
        <div className="bottom">
          <div className="mono">© 2026 OLD GAMER · NSK</div>
          <div className="mono">
            <a href="/privacy" style={{ color: "var(--ink-3)", marginRight: 16 }}>Политика конфиденциальности</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
