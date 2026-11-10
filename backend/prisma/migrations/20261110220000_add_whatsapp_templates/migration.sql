-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "statuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);


-- Default templates (editable from Admin → Expédition → Modèles WhatsApp)
INSERT INTO "whatsapp_templates" ("id", "name", "body", "statuses", "reasons", "sortOrder", "isActive", "updatedAt") VALUES
('tpl_default_suivi', 'Suivi de la commande',
 E'مرحبا {nom} 👋\nطلبيتك رقم {commande} راهي في الطريق 📦\nرقم التتبع: {tracking}\nتقدر تتبعها هنا: {lien_suivi}\nشكرا على ثقتك!',
 ARRAY[]::TEXT[], ARRAY[]::TEXT[], 100, true, CURRENT_TIMESTAMP),
('tpl_default_sorti', 'Sorti en livraison',
 E'مرحبا {nom} 👋\nطلبيتك {tracking} 📦 خرجت للتوصيل اليوم 🚚\nمن فضلك خلي التيليفون مفتوح وردّ على موزع ياليدين.\nالمبلغ: {prix} دج.\nشكرا!',
 ARRAY['Sorti en livraison', 'Prêt pour livreur', 'En localisation']::TEXT[], ARRAY[]::TEXT[], 10, true, CURRENT_TIMESTAMP),
('tpl_default_echec', 'Tentative échouée',
 E'مرحبا {nom}،\nموزع ياليدين حاول يوصلك الطلبية {tracking} وما قدرش ({raison}).\nواش يناسبك نعاودو التوصيل؟ ردّ علينا من فضلك 🙏',
 ARRAY['Tentative échouée', 'En alerte', 'En attente']::TEXT[], ARRAY[]::TEXT[], 10, true, CURRENT_TIMESTAMP),
('tpl_default_bureau', 'Colis au bureau Yalidine',
 E'مرحبا {nom} 👋\nطلبيتك {tracking} راهي تستنى فيك في {centre} 📍\nتقدر تجي تستلمها. المبلغ: {prix} دج.\nشكرا!',
 ARRAY['En attente du client', 'Reçu à Wilaya']::TEXT[], ARRAY[]::TEXT[], 20, true, CURRENT_TIMESTAMP),
('tpl_default_retour', 'Colis en retour',
 E'مرحبا {nom}،\nالطلبية {tracking} راهي راجعة لينا. واش صرا؟\nإذا مازلت حاب الطلبية قولنا باش نعاودو نبعثوها 🙏',
 ARRAY['Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour à retirer', 'Retour transfert', 'Retour groupé']::TEXT[], ARRAY[]::TEXT[], 10, true, CURRENT_TIMESTAMP),
('tpl_default_merci', 'Livré – remerciement',
 E'مرحبا {nom} 🌟\nنتمناو الطلبية عجبتك!\nشكرا على ثقتك في Loud Brands 💛',
 ARRAY['Livré']::TEXT[], ARRAY[]::TEXT[], 10, true, CURRENT_TIMESTAMP);
