# LINK//HUB

Hub personal de linkuri — un dashboard static, rapid, cu tool-uri, repo-uri și site-uri utile.
Zero login, zero backend, zero bază de date. Instalabil pe iPhone prin *Add to Home Screen*.

![Stack](https://img.shields.io/badge/Next.js-15-000) ![TS](https://img.shields.io/badge/TypeScript-strict-3178c6) ![PWA](https://img.shields.io/badge/PWA-offline-c9f24e)

---

## Cum adaug un tool nou

Editezi **un singur fișier**: [`data/tools.ts`](data/tools.ts). Adaugi un obiect în array:

```ts
{
  name: 'Nume Tool',
  url: 'https://exemplu.com',
  category: 'Dev Tools',                 // categorie nouă => pastilă nouă, automat
  shortDescription: 'O propoziție care apare pe card.',
  details: 'Ce face, pentru ce îl folosesc, când are sens să-l deschid.',
  emoji: '🧰',                            // opțional — fallback dacă favicon-ul nu se încarcă
}
```

Atât. Categoriile, contoarele, filtrele și ordinea alfabetică se recalculează singure.

- Ordinea pastilelor se controlează din `categoryOrder` (același fișier).
- Culoarea de accent per categorie se setează în `categoryAccents`. Dacă lipsește, se
  folosește accentul implicit — nimic nu se strică.

## Comenzi

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # export static complet in ./out
npm run start      # servește ./out local
npm run icons      # regenerează icoanele PWA (public/icons, favicon, apple-touch-icon)
npm run typecheck  # tsc --noEmit
```

## Scurtături de tastatură

| Tastă | Acțiune |
|---|---|
| `/` sau `Ctrl/⌘+K` | focus pe căutare |
| `Esc` | golește căutarea (sau închide modalul de detalii) |
| `1` … `9` | schimbă categoria (1 = Toate) |
| `Enter` / `Space` | deschide cardul focusat |

## Interacțiuni pe card

- **Click oriunde pe card** → deschide linkul în tab nou.
- **ⓘ** → deschide detaliile complete (nu deschide linkul).
- **☆** → fixează tool-ul sus (salvat în `localStorage`).
- **Copy** → copiază URL-ul (apare la hover; pe touch e mereu vizibil).

Se rețin în `localStorage`: tool-urile fixate (`linkhub:pins:v1`) și ultima categorie
folosită (`linkhub:category:v1`).

## Structură

```
app/
  layout.tsx          fonturi, metadata, manifest, viewport
  page.tsx            randează <Hub />
  globals.css         temă dark, grilă de fundal, grain, scrollbar
components/
  Hub.tsx             state, scurtături, persistență (client)
  SearchBar.tsx       căutare + contor "X din Y tool-uri"
  CategoryFilter.tsx  pastile de categorie
  ToolGrid.tsx        grid responsive + stare goală
  ToolCard.tsx        cardul, ⓘ / ☆ / copy
  DetailsPopover.tsx  modal cu detaliile complete
  ServiceWorker.tsx   înregistrează /sw.js (doar în producție)
data/tools.ts         ← DATELE (singurul fișier de editat)
lib/tools.ts          derivări, filtrare, sortare
lib/storage.ts        localStorage + clipboard
public/
  manifest.json  sw.js  icons/  apple-touch-icon.png  favicon.ico
scripts/generate-icons.mjs   generator de icoane PNG fără dependințe
```

## PWA

`public/manifest.json` + `public/sw.js` (app shell network-first, asset-uri
stale-while-revalidate, favicon-uri cache-first). Service worker-ul se înregistrează
**doar în producție**, ca să nu țină cache peste hot-reload în dev.

Pe iPhone: deschizi site-ul în Safari → *Share* → *Add to Home Screen*. Pornește
standalone, fără bara de browser, cu splash pe fundal `#07080a`.

## Deploy

Aplicația e export static (`output: 'export'` → folderul `out/`).

```bash
npx vercel --prod          # din rădăcina proiectului
```

Sau conectezi repo-ul în dashboard-ul Vercel — se detectează singur ca Next.js și
funcționează fără variabile de mediu.
