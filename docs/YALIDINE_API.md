# Yalidine API — reference

Condensed from the official Yalidine developer docs (dashboard → Developer).
Our implementation: `backend/src/services/yalidine.js`.

## Basics

- Base URL: `https://api.yalidine.app/v1/`
- REST, JSON responses. Send JSON bodies with `Content-Type: application/json`.
- Auth headers on **every** request: `X-API-ID`, `X-API-TOKEN`.
  Keep them server-side only (never in frontend code). Env vars: `YALIDINE_API_ID`, `YALIDINE_API_TOKEN`.
- All queries are logged; misuse can get the account banned.
- The token is only shown once, at generation. Regenerating pushes expiry +365 days and
  (presumably) invalidates the old token → update Heroku config vars at the same time.

## Rate limits

| Window | Default quota | Header (real) |
|---|---|---|
| second | 5 | `second-quota-left` |
| minute | 50 | `minute-quota-left` |
| hour | 1000 | `hour-quota-left` |
| day | 10000 | `day-quota-left` |

> ⚠️ The docs say the headers are `x-second-quota-left` etc. The **real** API (checked 2026-11-10)
> sends them **without** the `x-` prefix. Our code uses the real names.

- Each timer starts at your first request in that window.
- Over quota → `429 Too Many Requests`; wait `Retry-After` seconds.
- Repeatedly exceeding quota disables API access for increasing periods.
- Local development shares these quotas with production.

## Pagination & list format

- Query params: `page`, `page_size` (1–1000, default 100).
- Response: `{ has_more, total_data, data: [...], links: { self, before, next } }`.
- Common query options on list endpoints:
  - Filters accept comma-separated values (`?wilaya_id=16,19,6`), except date filters.
  - Date filters: one date `YYYY-MM-DD`, or a range `start,end`.
  - `fields=a,b` → only return those fields.
  - `order_by=<field>` plus bare `asc` or `desc` flag.

## Parcels

```
GET    /v1/parcels                list (filters below)
GET    /v1/parcels/:tracking      one parcel
GET    /v1/parcels/?tracking=a,b  several
POST   /v1/parcels                create one or many
PATCH  /v1/parcels/:tracking      edit
DELETE /v1/parcels/:tracking      delete one
DELETE /v1/parcels/?tracking=a,b  delete several
```

> ⚠️ **Personal data is masked** in GET and PATCH responses (`firstname`, `familyname`,
> `contact_phone`, `address`, phone part of `qr_text`), e.g. `"M*****d"`.
> Never write these values back into our database.

### Create — `POST /v1/parcels/`

Body is an **array** of parcel objects (even for one parcel).

| Field | Required | Notes |
|---|---|---|
| `order_id` | yes | unique within the request; used to key the response |
| `from_wilaya_name` | yes | name from `/wilayas` |
| `firstname`, `familyname` | yes | |
| `contact_phone` | yes | starts with 0; 10 digits mobile (05/06/07…), 9 digits landline; comma-separated for several |
| `address` | yes | |
| `to_wilaya_name`, `to_commune_name` | yes | names from `/wilayas`, `/communes` |
| `product_list` | yes | description of contents |
| `price` | yes | integer, 0–150000, amount collected from the customer |
| `do_insurance` | yes | boolean |
| `declared_value` | yes | integer, 0–150000 |
| `length`, `width`, `height` | yes | integer cm, ≥ 0 |
| `weight` | yes | integer kg, ≥ 0 |
| `freeshipping` | yes | true = sender pays delivery |
| `is_stopdesk` | yes | true = stop desk, false = home |
| `stopdesk_id` | if `is_stopdesk` | center id from `/centers` |
| `has_exchange` | yes | boolean |
| `product_to_collect` | if `has_exchange` | what to bring back |
| `opening_decision` | no | `accept` / `reject` (allow opening) |

**Response is an object keyed by `order_id`** — not a flat object:

```json
{
  "MyFirstOrder": {
    "success": true, "order_id": "MyFirstOrder", "tracking": "yal-12345A",
    "import_id": 234, "label": "https://…", "labels": "https://…", "message": ""
  },
  "MySecondOrder": {
    "success": false, "order_id": "MySecondOrder", "tracking": null,
    "message": "The do_insurance parameter must be of type boolean"
  }
}
```

Valid parcels are created even if others in the same request fail.

### Edit — `PATCH /v1/parcels/:tracking`

- **Only possible while last status is `En préparation`.**
- Send only the fields to change: `order_id`, `opening_decision`, `firstname`, `familyname`,
  `contact_phone`, `address`, `from_wilaya_name`, `to_wilaya_name` (then `to_commune_name` is required),
  `to_commune_name`, `product_list`, `price`, `do_insurance`, `declared_value`, `length`, `width`,
  `height`, `weight`, `freeshipping`, `is_stopdesk` (+ `stopdesk_id`), `has_exchange` (+ `product_to_collect`).
- Returns the parcel (with masked personal data).

### Delete — `DELETE /v1/parcels/:tracking`

- **Only possible while last status is `En préparation`.**
- Response is per tracking: `{ "tracking": "yal-…", "deleted": true | false }`.
  `deleted: false` = cannot be deleted / misspelled / doesn't exist / already deleted.
  **An HTTP 200 does not mean it was deleted — check `deleted`.**

### List filters

`tracking`, `order_id`, `import_id`, `to_wilaya_id`, `to_commune_name`, `is_stopdesk`, `is_exchange`,
`has_exchange`, `freeshipping`, `date_creation`, `date_last_status`, `payment_status`, `last_status`,
`fields`, `page`, `page_size`, `order_by` (`date_creation` default desc, `date_last_status`, `tracking`,
`order_id`, `import_id`, `to_wilaya_id`, `to_commune_id`, `last_status`), `asc` / `desc`.

### Parcel fields (response)

`tracking`, `order_id`, `firstname`*, `familyname`*, `contact_phone`*, `address`*, `is_stopdesk`,
`stopdesk_id`, `stopdesk_name`, `from_wilaya_id/name`, `to_commune_id/name`, `to_wilaya_id/name`,
`product_list`, `price`, `do_insurance`, `declared_value`, `delivery_fee`, `freeshipping`, `import_id`,
`date_creation`, `date_expedition`, `date_last_status`, `last_status`, `taxe_percentage`, `taxe_from`,
`taxe_retour`, `parcel_type` (classic/ecommerce/multiseller), `parcel_sub_type`
(accuse/exchange/rcc/rccback/sm), `has_receipt`, `length`, `width`, `height`, `weight`,
`has_recouvrement`, `return_center_code`, `current_center_id/name`, `current_wilaya_id/name`,
`current_commune_id/name`, `payment_status`, `payment_id`, `has_exchange`, `product_to_collect`,
`label`, `labels`, `pin`, `qr_text`*  (* = masked)

- COD fee = `taxe_percentage * price / 100`, applied when `price >= taxe_from`.

### `payment_status` values

`not-ready`, `ready`, `receivable`, `payed`

### `last_status` values

Pas encore expédié · A vérifier · En préparation · Pas encore ramassé · Prêt à expédier ·
En passation · Ramassé · Bloqué · Débloqué · Transfert · Expédié · Centre · En localisation ·
Vers Wilaya · En transit · Reçu à Wilaya · En attente du client · Prêt pour livreur ·
Sorti en livraison · En attente · Annulé · En alerte · Tentative échouée · Livré ·
Echèc livraison · Retour vers centre · Retourné au centre · Retour transfert · Retour groupé ·
Retour à retirer · Retour non retiré · Colis abandonné · Retour vers vendeur ·
Retourné au vendeur · Switch annulé · Echange échoué
(Histories can also contain `Alerte résolue`.)

## Histories (status timeline)

```
GET /v1/histories
GET /v1/histories/:tracking
GET /v1/histories/?tracking=a,b
```

- Item: `{ date_status, tracking, status, reason, center_id, center_name, wilaya_id, wilaya_name, commune_id, commune_name }`
- Filters: `tracking`, `status`, `date_status`, `reason`, `fields`, `page`, `page_size`,
  `order_by` (`date_status` default desc, `tracking`, `status`, `reason`), `asc` / `desc`.
- `reason` values:
  - Failed delivery: Téléphone injoignable · Client ne répond pas · Faux numéro ·
    Client absent (reporté) · Client absent (échoué) · Annulé par le client · Commande double ·
    Le client n'a pas commandé · Produit erroné · Produit manquant · Produit cassé ou défectueux ·
    Client incapable de payer · Wilaya erronée · Commune erronée · Client no-show · Adresse non livrable
  - Parcel hold: Document manquant · Produit interdit · Produit dangereux · Fausse déclaration

## Centers (stop desks)

```
GET /v1/centers
GET /v1/centers/:center_id
```

- Item: `{ center_id, name, address, gps: "lat,long", commune_id, commune_name, wilaya_id, wilaya_name }`
- Filters: `center_id`, `commune_id`, `commune_name`, `wilaya_id`, `wilaya_name`, `fields`, paging,
  `order_by` (`center_id` default asc, `commune_id`, `wilaya_id`).

## Communes

```
GET /v1/communes
GET /v1/communes/:id
```

- Item: `{ id, name, wilaya_id, wilaya_name, has_stop_desk, is_deliverable, delivery_time_parcel, delivery_time_payment }` (times in days)
- Filters: `id`, `wilaya_id`, `has_stop_desk`, `is_deliverable`, `fields`, paging, `order_by` (`id`, `wilaya_id`).
- ~1541 communes in total → paginate (max 1000 per page).

## Wilayas

```
GET /v1/wilayas
GET /v1/wilayas/:id
```

- Item: `{ id, name, zone, is_deliverable }` — 58 wilayas.
- Filters: `id`, `name`, `fields`, paging, `order_by` (`id`, `name`).

## Fees

```
GET /v1/fees/?from_wilaya_id=X&to_wilaya_id=Y     (both required)
```

```json
{
  "from_wilaya_name": "Batna", "to_wilaya_name": "Adrar", "zone": 4,
  "retour_fee": 250, "cod_percentage": 0.75, "insurance_percentage": 0.75, "oversize_fee": 100,
  "per_commune": {
    "101": { "commune_id": 101, "commune_name": "Adrar",
             "express_home": 1400, "express_desk": 1100,
             "economic_home": null, "economic_desk": null }
  }
}
```

- `cod_percentage` and `insurance_percentage` apply to max(declared_value, price).
- `express_*` / `economic_*` include commune tax but **not** the overweight fee.
- Overweight:
  - volumetric weight = width × height × length (cm) × 0.0002
  - billable weight = max(volumetric, actual kg)
  - if billable > 5: overweight fee = (billable − 5) × `oversize_fee`, else 0
  - total = delivery fee + overweight fee

---

# Webhooks

Dashboard: Yalidine → Développeur → Webhooks. Our endpoint: `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api/webhooks/yalidine`
(handler: `backend/src/routes/webhooks.js`). Secret key env var: `YALIDINE_WEBHOOK_SECRET`.

## Event types

`parcel_created`, `parcel_edited`, `parcel_deleted`, `parcel_status_updated`, `parcel_payment_updated`

## Validation (CRC) — must ALWAYS work

- Yalidine sends `GET <url>?subscribe=…&crc_token=…` on create, on edit, and **from time to time**.
- Respond 2xx within 10 s with the body = the `crc_token` value. Otherwise the webhook is disabled.

## Delivery format

`POST`, JSON body, one event type per request, events of the same type grouped:

```json
{
  "type": "parcel_status_updated",
  "events": [
    { "event_id": "vysTdoxk1h5QpMeqDcGfuBUbFE3Z4SWI",
      "occurred_at": "2022-04-28 00:01:26",
      "data": { "tracking": "yal-111AAA", "status": "Sorti en livraison", "reason": null } }
  ]
}
```

`data` per type:

| type | data |
|---|---|
| `parcel_created` | `order_id`, `tracking`, `label`, `import_id` |
| `parcel_edited` | `tracking`, `label` |
| `parcel_deleted` | `tracking` |
| `parcel_status_updated` | `tracking`, `status` (a `last_status` value), `reason` (or null) |
| `parcel_payment_updated` | `tracking`, `status` (`not-ready`/`ready`/`receivable`/`payed`), `payment_id` |

- New fields may appear without notice → ignore unknown fields.
- **Duplicates happen** → dedupe on `event_id`.
- **Order is not guaranteed** → use `occurred_at`; never overwrite a newer status with an older one.

## Security

- Header `X-YALIDINE-SIGNATURE` (Node: `req.headers['x-yalidine-signature']`).
- Signature = `HMAC-SHA256(rawBody, secretKey)` as hex. Must be computed on the **raw request bytes**,
  not on re-serialized JSON. Missing or wrong signature → respond 400 and ignore.

## Response & retries

- Respond 2xx in **< 10 s**. Recommended: store the payload, reply immediately, process afterwards.
- On failure: 7 attempts total — immediately, +5 min, +15 min, +1 h, +3 h, +12 h, +1 day (~40 h),
  an email after each failure, then the webhook is **automatically disabled**.
- Disabled webhook: queued events keep being retried until their attempts run out; re-enabling in time delivers them.

## Dashboard tools

- "Faire des tests": sends sample events of each subscribed type (not logged).
- "Journal": delivery log, kept 48 h.
- A newly created webhook starts **disabled**; enable it with "Changer l'état".
