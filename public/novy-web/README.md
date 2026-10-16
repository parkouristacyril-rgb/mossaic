# Mossaic — web + workspace (jeden statický web)

Obsah:
- `index.html` — celý web: landing → „Začít zdarma“ → registrace (4 kroky) → workspace
- `tour/tour_cz.mp4`, `tour/tour_en.mp4` — videa pro prohlídku ve workspace
- `vercel.json` — cache hlavičky

## Nasazení (Vercel)
1. Nahraj obsah složky do repa napojeného na Vercel (nebo `npx vercel` přímo z ní).
2. Framework preset: **Other**, bez build příkazu, output = kořen složky.
3. Každý push do produkční větve Vercel nasadí sám.

## Napojení na backend (jediné místo)
V `index.html` hledej `<script id="mossaic-backend">` → objekt `window.MOSSAIC_BACKEND`.
Každá funkce je volitelná, smí vracet Promise, chybu vrací jako `{ error: 'text' }`:

| funkce | kdy se volá | vrací |
|---|---|---|
| `signUp({org,email,pass,plan})` | registrace, krok 2 | `{ account }` |
| `checkout({plan,email,successUrl,cancelUrl}, account)` | registrace, krok 3 (platba) | `{ url }` = Stripe Checkout Session URL |
| `signIn(email, pass)` | přihlášení | `{ account }` |
| `resume()` | načtení stránky (session/cookie) | `{ account }` nebo `null` |
| `signOut()` | Settings → Sign out | – |
| `capture(observations[], account)` | uložené video/postřeh (Capture, bulk) | – |
| `invite(email, account)` | pozvánka do týmu | – |
| `saveSettings({org,handles}, account)` | Settings → Save | – |
| `changePlan(planId, account)` | Pricing → Get Started | – |
| `contactSales(account)` | Talk to Sales | – |
| `generateIdeas(brief, account)` | Video Ideas → Generate | `{ ideas:[{title,why,pattern}] }` |

Tvar účtu: `{ email, org, plan, createdAt, handles:{tiktok,instagram}, team:[{email,role,status}], observations:[{url,note,at}] }`

Dokud je funkce `null`, stránka použije úložiště v prohlížeči (funguje, ale účet žije jen v daném prohlížeči).
Docs (odkaz v patičce) ukazují příklad API `https://api.mossaic.net/v1/videos` — uprav na skutečnou adresu.

## Platby (Stripe)
Krok 3 registrace je platba. Dokud `checkout` je `null`, stránka napíše, že platby se zapínají, a pustí dál bez platby.
Po napojení: server vytvoří Stripe Checkout Session (subscription) se `success_url`/`cancel_url` z argumentu a vrátí `{ url }`. Stránka přesměruje na Stripe; po návratu (`?checkout=success|cancel`) pokračuje v registraci sama. Předplatné aktivuj z webhooku Stripe.
