# Parcel product list format (Yalidine → Smart Inventory)

This document describes how the **parcel description** (`product_list` / `productList`) is written when creating Yalidine shipments and how it **must** be formatted so that Smart Inventory (Entrée, Sortie, Échange, Retour) can parse it correctly.

## Where the description is written

1. **Orders** – When you change order status to **Confirmed** (`loudbrandss.com/admin/orders`):
   - Backend: `backend/src/routes/shipping.js` → `POST /ship-order/:orderId`
   - Builds `product_list` from order items and sends it to Yalidine.

2. **Wholesale / Confirmatrice**:
   - Backend: `backend/src/routes/confirmatrice.js` → `formatOrderForYalidine`
   - Same format as orders: one line per item, see below.

3. **Shipping dashboard (manual shipments)**:
   - Frontend: `frontend/components/admin/dashboards/shipping-role-dashboard.tsx`
   - When creating a shipment from an order or manually, `productList` is sent to the API and stored on the Yalidine parcel.

The value sent to Yalidine is stored as the parcel’s **product list**. When you scan a Yalidine tracking in Smart Inventory, the app reads `shipment.product_list` (or `shipment.productList`) and parses it with `parseYalidineProductList()`.

---

## Format expected by Smart Inventory (Entrée, Sortie, Échange, Retour)

Parser: `parseYalidineProductList()` in `frontend/app/admin/inventory/smart/page.tsx`.

### Preferred format (legacy, one line per item)

- **One line per product.**
- Each line: `{quantity}x {Product Name} ({Size})`
- Size is **optional** (e.g. accessories). If no size: `{quantity}x {Product Name}` (no parentheses).
- Lines separated by **newline** (`\n`).

Examples:

```text
2x T-Shirt Loud (M)
1x Cap (L)
3x Chaussures Run (40)
1x Accessoire
```

Regex used: `^(\d+)x\s+(.+?)(?:\s+\(([^)]+)\))?$`  
→ quantity, product name, and optional size in parentheses.

### Alternative format (single-line)

If the string is not mainly newline-based lines in the format above, the parser tries a single-line pattern:

- Pattern: `Product Name (Size)` optionally followed by `1x` or `2x`.
- Example: `T-Shirt (M)2x Cap (L)1x`

For consistent behavior and correct size matching, the **legacy format** (one line per item with `(Size)`) should be used everywhere.

---

## Format that must be used when writing the description

When building `product_list` for Yalidine (orders, wholesale, or manual shipment form), use:

- **One line per item:** `{quantity}x {product.name} ({size})`
- If there is **no size**: `{quantity}x {product.name}` (no parentheses).
- Join lines with **newline** (`\n`).

Correct examples:

- `2x T-Shirt Loud (M)\n1x Cap (L)`
- `1x Produit sans taille`

In code:

```js
order.items.map(item => {
  const sizeStr = item.size || item.productSize?.size || '';
  return `${item.quantity}x ${item.product.name}${sizeStr ? ` (${sizeStr})` : ''}`;
}).join('\n');
```

---

## Inconsistencies found and fix

- **Orders (shipping.js)** and **Confirmatrice (confirmatrice.js)** already use the correct format: `(Size)` and newlines.
- **Shipping role dashboard** was building lines as `2x Product Name Size` (size without parentheses). That was fixed to use `2x Product Name (Size)` so Smart Inventory parses quantity, name, and size correctly for Entrée, Sortie, Échange, and Retour.

---

## Summary

| Source                    | Format used / fixed |
|---------------------------|----------------------|
| Orders (status → Confirmed) | `2x Product Name (Size)` per line, `\n` |
| Confirmatrice (wholesale) | `2x Product Name (Size)` per line, `\n` |
| Shipping dashboard        | Fixed to `2x Product Name (Size)` per line, `\n` |

Smart Inventory (all four parts: Entrée, Sortie, Échange, Retour) expects the parcel’s `product_list` in this format so it can reliably parse and match products and sizes.
