export type Locale = 'ar' | 'fr'

export const locales: Locale[] = ['ar', 'fr']
export const defaultLocale: Locale = 'ar'

export interface Translations {
  // Navigation
  nav: {
    home: string
    products: string
    categories: string
    about: string
    contact: string
    cart: string
    wishlist: string
    login: string
    logout: string
    profile: string
    trackOrder: string
    faq: string
  }

  // Common
  common: {
    search: string
    searchPlaceholder: string
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    edit: string
    delete: string
    view: string
    back: string
    next: string
    previous: string
    close: string
    submit: string
    required: string
    optional: string
    currency: string
    outOfStock: string
    inStock: string
    sale: string
    new: string
    featured: string
    bestseller: string
    addToCart: string
    buyNow: string
    viewDetails: string
    shareProduct: string
    addToWishlist: string
    removeFromWishlist: string
    quantity: string
    size: string
    color: string
    price: string
    total: string
    subtotal: string
    deliveryFee: string
    free: string
    continueShopping: string
    proceedToCheckout: string
    clearCart: string
    emptyCart: string
    itemsInCart: string
    fullName: string
    email: string
    phoneNumber: string
    subject: string
    message: string
  }

  // Product
  product: {
    description: string
    specifications: string
    features: string
    reviews: string
    rating: string
    reference: string
    brand: string
    category: string
    availability: string
    warranty: string
    freeDelivery: string
    easyReturns: string
    securePayment: string
    support247: string
    selectSize: string
    selectColor: string
    maxQuantity: string
    productNotFound: string
    relatedProducts: string
    recentlyViewed: string
    launch: {
      availableNow: string
      launchIn: string
      comingSoon: string
      launchMode: string
      launchDate: string
      launchEnabled: string
      launchDisabled: string
    }
  }

  // Checkout
  checkout: {
    title: string
    customerInfo: string
    deliveryOptions: string
    reviewOrder: string
    orderSummary: string
    fullName: string
    phoneNumber: string
    email: string
    deliveryType: string
    homeDelivery: string
    pickupFromDesk: string
    city: string
    address: string
    pickupLocation: string
    orderNotes: string
    paymentMethod: string
    cashOnDelivery: string
    placeOrder: string
    placingOrder: string
    orderPlaced: string
    estimatedDelivery: string
    orderConfirmation: string
    whatNext: string
    needHelp: string
  }

  // Footer
  footer: {
    quickLinks: string
    customerService: string
    contactInfo: string
    newsletter: string
    subscribeNewsletter: string
    enterEmail: string
    subscribe: string
    followUs: string
    allRightsReserved: string
    privacyPolicy: string
    termsOfService: string
    cookiePolicy: string
    freeShipping: string
    securePayment: string
    support247: string
    easyReturns: string
  }

  // Pages
  pages: {
    home: {
      heroTitle: string
      heroSubtitle: string
      shopNow: string
      shopByCategory: string
      featuredProducts: string
      stayUpdated: string
      newsletterText: string
    }

    loudBrands: {
      whoWeAre: string
      ourStory: string
      ourValues: string
      loudBrands: string
      fromHeart: string
      leadingBrand: string
      loudStylesDesc: string
      loudimDesc: string
      proudAlgerian: string
      storyBegin: string
      storyJourney: string
      storyInnovation: string
      loudStylesPurpose: string
      loudimPurpose: string
      storyToday: string
      qualityFirst: string
      qualityFirstDesc: string
      refinedElegance: string
      refinedEleganceDesc: string
      localIndustry: string
      localIndustryDesc: string
      boldness: string
      boldnessDesc: string
      innovation: string
      innovationDesc: string
      exploreLoudim: string
      exploreLoudStyles: string
      loudimTagline: string
      loudStylesTagline: string
    }

    about: {
      title: string
      subtitle: string
      ourStory: string
      ourValues: string
      meetOurTeam: string
      ourMission: string
      customerFirst: string
      qualityAssurance: string
      fastDelivery: string
      excellence: string
    }

    contact: {
      title: string
      subtitle: string
      sendMessage: string
      faq: string
      phone: string
      email: string
      address: string
      businessHours: string
      stillHaveQuestions: string
      callUs: string
      sendUsMessage: string
    }

    faq: {
      title: string
      subtitle: string
      searchAnswers: string
      allCategories: string
      ordersDelivery: string
      paymentPricing: string
      returnsExchanges: string
      accountSecurity: string
      productsQuality: string
      noResults: string
      clearSearch: string
    }

    trackOrder: {
      title: string
      subtitle: string
      orderNumber: string
      trackOrder: string
      searching: string
      orderFound: string
      orderNotFound: string
      orderDetails: string
      trackingTimeline: string
      orderItems: string
    }

    wishlist: {
      title: string
      subtitle: string
      emptyWishlist: string
      emptyWishlistText: string
      startShopping: string
      shareWishlist: string
      addAllToCart: string
      youMightLike: string
      exploreMore: string
      addedOn: string
    }
  }

  // Admin
  admin: {
    dashboard: string
    products: string
    inventory: string
    orders: string
    shipping: string
    categories: string
    users: string
    analytics: string
    settings: string
    customerCalls: string
    orderProcessing: string
    deliveryAreas: string
    logout: string
    roleNames: {
      ADMIN: string
      SUPERADMIN: string
      CALL_CENTER: string
      ORDER_CONFIRMATION: string
      DELIVERY_COORDINATOR: string
      USER: string
    }
    sidebarTitle: string
    stats: {
      happyCustomers: string
      productsSold: string
      citiesCovered: string
      yearsExperience: string
    }
    values: {
      customerFirst: string
      qualityAssurance: string
      fastDelivery: string
      excellence: string
    }
    team: {
      meetOurTeam: string
      founder: string
      headOfOperations: string
      technologyDirector: string
      description1: string
      description2: string
      description3: string
    }
    contactInfo: {
      phone: string
      email: string
      address: string
      businessHours: string
      callUs: string
      sendUsMessage: string
      details: {
        phone: string[]
        email: string[]
        address: string[]
        businessHours: string[]
      }
    }
    faq: {
      q1: string
      a1: string
      q2: string
      a2: string
      q3: string
      a3: string
      q4: string
      a4: string
    }
    form: {
      productName: string
      productNameAr: string
      description: string
      descriptionAr: string
      categoryName: string
      categoryNameAr: string
      price: string
      stock: string
      image: string
      status: string
      actions: string
      view: string
      edit: string
      delete: string
      save: string
      cancel: string
      create: string
      update: string
      search: string
      filter: string
      sort: string
      export: string
      import: string
      bulkActions: string
      selectAll: string
      clearSelection: string
    }
    messages: {
      loading: string
      error: string
      success: string
      confirmDelete: string
      noData: string
      noResults: string
      retry: string
      back: string
      next: string
      previous: string
      close: string
      submit: string
      reset: string
    }
  }
}

export const translations: Record<Locale, Translations> = {

  ar: {
    nav: {
      home: 'الرئيسية',
      products: 'المنتجات',
      categories: 'الفئات',
      about: 'من نحن',
      contact: 'اتصل بنا',
      cart: 'السلة',
      wishlist: 'المفضلة',
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      profile: 'الملف الشخصي',
      trackOrder: 'تتبع الطلب',
      faq: 'الأسئلة الشائعة'
    },

    common: {
      search: 'بحث',
      searchPlaceholder: 'البحث عن المنتجات...',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      cancel: 'إلغاء',
      save: 'حفظ',
      edit: 'تعديل',
      delete: 'حذف',
      view: 'عرض',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      submit: 'إرسال',
      required: 'مطلوب',
      optional: 'اختياري',
      currency: 'د.ج',
      outOfStock: 'غير متوفر',
      inStock: 'متوفر',
      sale: 'تخفيض',
      new: 'جديد',
      featured: 'مميز',
      bestseller: 'الأكثر مبيعاً',
      addToCart: 'أضف للسلة',
      buyNow: 'اشتري الآن',
      viewDetails: 'عرض التفاصيل',
      shareProduct: 'مشاركة المنتج',
      addToWishlist: 'أضف للمفضلة',
      removeFromWishlist: 'إزالة من المفضلة',
      quantity: 'الكمية',
      size: 'المقاس',
      color: 'اللون',
      price: 'السعر',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      free: 'مجاني',
      continueShopping: 'متابعة التسوق',
      proceedToCheckout: 'إتمام الطلب',
      clearCart: 'إفراغ السلة',
      emptyCart: 'سلتك فارغة',
      itemsInCart: 'عنصر في السلة',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      phoneNumber: 'رقم الهاتف',
      subject: 'الموضوع',
      message: 'الرسالة'
    },

    product: {
      description: 'الوصف',
      specifications: 'المواصفات',
      features: 'المميزات',
      reviews: 'التقييمات',
      rating: 'التقييم',
      reference: 'المرجع',
      brand: 'العلامة التجارية',
      category: 'الفئة',
      availability: 'التوفر',
      warranty: 'الضمان',
      freeDelivery: 'توصيل مجاني',
      easyReturns: 'إرجاع سهل',
      securePayment: 'دفع آمن',
      support247: 'دعم على مدار الساعة',
      selectSize: 'يرجى اختيار المقاس',
      selectColor: 'يرجى اختيار اللون',
      maxQuantity: 'الحد الأقصى',
      productNotFound: 'المنتج غير موجود',
      relatedProducts: 'منتجات ذات صلة',
      recentlyViewed: 'شوهدت مؤخراً',
      launch: {
        availableNow: 'متوفر الآن!',
        launchIn: 'الإطلاق في:',
        comingSoon: 'قريباً',
        launchMode: 'وضع الإطلاق',
        launchDate: 'تاريخ ووقت الإطلاق',
        launchEnabled: 'تم تفعيل وضع الإطلاق',
        launchDisabled: 'تم إلغاء وضع الإطلاق'
      }
    },

    checkout: {
      title: 'إتمام الطلب',
      customerInfo: 'معلومات العميل',
      deliveryOptions: 'خيارات التوصيل',
      reviewOrder: 'مراجعة الطلب',
      orderSummary: 'ملخص الطلب',
      fullName: 'الاسم الكامل',
      phoneNumber: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      deliveryType: 'نوع التوصيل',
      homeDelivery: 'توصيل منزلي',
      pickupFromDesk: 'استلام من المكتب',
      city: 'المدينة',
      address: 'العنوان',
      pickupLocation: 'موقع الاستلام',
      orderNotes: 'ملاحظات الطلب',
      paymentMethod: 'طريقة الدفع',
      cashOnDelivery: 'الدفع عند الاستلام',
      placeOrder: 'تأكيد الطلب',
      placingOrder: 'جاري تأكيد الطلب...',
      orderPlaced: 'تم تأكيد الطلب بنجاح!',
      estimatedDelivery: 'التوصيل المتوقع',
      orderConfirmation: 'تأكيد الطلب',
      whatNext: 'ما التالي؟',
      needHelp: 'تحتاج مساعدة؟'
    },

    footer: {
      quickLinks: 'روابط سريعة',
      customerService: 'خدمة العملاء',
      contactInfo: 'معلومات الاتصال',
      newsletter: 'النشرة الإخبارية',
      subscribeNewsletter: 'اشترك في نشرتنا الإخبارية',
      enterEmail: 'أدخل بريدك الإلكتروني',
      subscribe: 'اشتراك',
      followUs: 'تابعنا',
      allRightsReserved: 'جميع الحقوق محفوظة',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfService: 'شروط الخدمة',
      cookiePolicy: 'سياسة ملفات تعريف الارتباط',
      freeShipping: 'شحن مجاني',
      securePayment: 'دفع آمن',
      support247: 'دعم على مدار الساعة',
      easyReturns: 'إرجاع سهل'
    },

    pages: {
      home: {
        heroTitle: 'تسوق الأفضل',
        heroSubtitle: 'اكتشف منتجات مذهلة مع توصيل سريع في جميع أنحاء الجزائر',
        shopNow: 'تسوق الآن',
        shopByCategory: 'تسوق حسب الفئة',
        featuredProducts: 'المنتجات المميزة',
        stayUpdated: 'ابق على اطلاع',
        newsletterText: 'اشترك في نشرتنا الإخبارية وكن أول من يعرف عن المنتجات الجديدة والعروض الحصرية'
      },

      loudBrands: {
        whoWeAre: 'من نحن',
        ourStory: 'قصتنا',
        ourValues: 'قيمنا',
        loudBrands: 'LOUD Brands',
        fromHeart: 'من قلب الجزائر، نحن نعيد تعريف الأناقة بأسلوب يجمع بين الحداثة والأصالة.',
        leadingBrand: 'نحن علامة جزائرية رائدة متخصصة في تصميم وإنتاج ملابس المناسبات والملابس اليومية، من خلال فرعين متميزين:',
        loudStylesDesc: 'فساتين أعراس وملابس سهرات فاخرة.',
        loudimDesc: 'ملابس خارجية أنيقة وملابس كاجوال راقية.',
        proudAlgerian: 'نحن هنا لنقدم للنساء الجزائريات خيارات محلية تنافس بقوة العلامات التجارية الدولية—بفخر كامل، نحن 100% جزائريون.',
        storyBegin: 'بدأت LOUD Brands كحلم بسيط: إنشاء موضة محلية تعكس هوية المرأة الجزائرية وتلبي ذوقها المتميز في كل مناسبة.',
        storyJourney: 'من فستان زفاف يخلد لحظة كبيرة في الحياة إلى إطلالة كاجوال تعكس ذاتك اليومية—كانت رحلتنا مليئة بالشغف والتصميم والالتزام بالجودة.',
        storyInnovation: 'اخترنا أن نكون مختلفين... لذلك ابتكرنا من خلال إنشاء فرعين لخدمة كل جانب من جوانب حياتك:',
        loudStylesPurpose: 'لكل لحظة عظيمة، إطلالة تليق بك.',
        loudimPurpose: 'لكل يوم، أناقة تناسبك.',
        storyToday: 'اليوم، نحن فخورون بأن نكون علامة جزائرية تحدث فرقاً مع كل خطوة.',
        qualityFirst: 'الجودة أولاً',
        qualityFirstDesc: 'من أول خيط إلى آخر غرزة، نحرص على أن يكون كل تفصيل في منتجاتنا مثالاً للجودة والتميز.',
        refinedElegance: 'أناقة راقية',
        refinedEleganceDesc: 'تصاميمنا تجمع بين الحداثة والأصالة لتعكس شخصيتك بأسلوب راقٍ وفاخر.',
        localIndustry: 'تمكين الصناعة المحلية',
        localIndustryDesc: 'نفخر بأن كل قطعة تُنتج بحب في الجزائر، لتدعم الصناعة المحلية بكل فخر.',
        boldness: 'الجسارة والتميز',
        boldnessDesc: 'نؤمن بأن كل امرأة تستحق أن تتألق بأسلوبها الخاص وتكون فريدة ومميزة.',
        innovation: 'الابتكار المستمر',
        innovationDesc: 'نواكب أحدث خطوط الموضة ونكيفها لتتناسب مع ذوقك المحلي وتلبي حاجتك.',
        exploreLoudim: 'استكشفي LOUDIM',
        exploreLoudStyles: 'استكشفي LOUD STYLES',
        loudimTagline: 'مجموعة LOUDIM تجمع بين الأناقة والراحة، مصممة للمرأة العصرية التي تبحث عن التميز في كل مناسبة.',
        loudStylesTagline: 'مجموعة LOUD STYLES تجسد الفخامة والأناقة، مصنوعة للمرأة التي تطالب بالتميز في كل لحظة.'
      },

      about: {
        title: 'حول متجر الجزائر الإلكتروني',
        subtitle: 'نحن في مهمة لثورة التسوق عبر الإنترنت في الجزائر',
        ourStory: 'قصتنا',
        ourValues: 'قيمنا',
        meetOurTeam: 'تعرف على فريقنا',
        ourMission: 'مهمتنا',
        customerFirst: 'العميل أولاً',
        qualityAssurance: 'ضمان الجودة',
        fastDelivery: 'توصيل سريع',
        excellence: 'التميز'
      },

      contact: {
        title: 'اتصل بنا',
        subtitle: 'نحن هنا للمساعدة! تواصل معنا لأي أسئلة أو استفسارات أو ملاحظات.',
        sendMessage: 'أرسل لنا رسالة',
        faq: 'الأسئلة الشائعة',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        address: 'العنوان',
        businessHours: 'ساعات العمل',
        stillHaveQuestions: 'لا تزال لديك أسئلة؟',
        callUs: 'اتصل بنا',
        sendUsMessage: 'أرسل لنا رسالة'
      },

      faq: {
        title: 'الأسئلة الشائعة',
        subtitle: 'اعثر على إجابات للأسئلة الشائعة حول التسوق والتوصيل والإرجاع والمزيد.',
        searchAnswers: 'البحث عن إجابات...',
        allCategories: 'جميع الفئات',
        ordersDelivery: 'الطلبات والتوصيل',
        paymentPricing: 'الدفع والتسعير',
        returnsExchanges: 'الإرجاع والاستبدال',
        accountSecurity: 'الحساب والأمان',
        productsQuality: 'المنتجات والجودة',
        noResults: 'لم يتم العثور على نتائج',
        clearSearch: 'مسح البحث'
      },

      trackOrder: {
        title: 'تتبع طلبك',
        subtitle: 'أدخل رقم طلبك لتتبع الطرد ومشاهدة التحديثات في الوقت الفعلي',
        orderNumber: 'رقم الطلب',
        trackOrder: 'تتبع الطلب',
        searching: 'جاري البحث...',
        orderFound: 'تم العثور على الطلب!',
        orderNotFound: 'لم يتم العثور على الطلب. يرجى التحقق من رقم الطلب.',
        orderDetails: 'تفاصيل الطلب',
        trackingTimeline: 'الجدول الزمني للتتبع',
        orderItems: 'عناصر الطلب'
      },

      wishlist: {
        title: 'قائمة المفضلة',
        subtitle: 'تتبع العناصر التي تحبها وتريد شراؤها لاحقاً',
        emptyWishlist: 'قائمة المفضلة فارغة',
        emptyWishlistText: 'ابدأ بإضافة عناصر إلى قائمة المفضلة بالنقر على أيقونة القلب على المنتجات التي تحبها',
        startShopping: 'ابدأ التسوق',
        shareWishlist: 'مشاركة قائمة المفضلة',
        addAllToCart: 'أضف الكل للسلة',
        youMightLike: 'قد يعجبك أيضاً',
        exploreMore: 'استكشف المزيد من المنتجات',
        addedOn: 'أضيف في'
      }
    },
    admin: {
      dashboard: 'لوحة التحكم',
      products: 'المنتجات',
      inventory: 'المخزون',
      orders: 'الطلبات',
      shipping: 'الشحن',
      categories: 'الفئات',
      users: 'المستخدمون',
      analytics: 'التحليلات',
      settings: 'الإعدادات',
      customerCalls: 'مكالمات العملاء',
      orderProcessing: 'معالجة الطلبات',
      deliveryAreas: 'مناطق التوصيل',
      logout: 'تسجيل الخروج',
      roleNames: {
        ADMIN: 'مدير',
        SUPERADMIN: 'مدير عام',
        CALL_CENTER: 'موظف مركز الاتصال',
        ORDER_CONFIRMATION: 'معالج الطلبات',
        DELIVERY_COORDINATOR: 'مندوب التوصيل',
        USER: 'مستخدم'
      },
      sidebarTitle: 'لوحة تحكم لوديم',
      stats: {
        happyCustomers: 'عملاء سعداء',
        productsSold: 'منتجات مباعة',
        citiesCovered: 'مدن مشمولة',
        yearsExperience: 'سنوات الخبرة'
      },
      values: {
        customerFirst: 'العميل أولاً',
        qualityAssurance: 'ضمان الجودة',
        fastDelivery: 'توصيل سريع',
        excellence: 'التميز'
      },
      team: {
        meetOurTeam: 'تعرف على فريقنا',
        founder: 'المؤسس والرئيس التنفيذي',
        headOfOperations: 'رئيس العمليات',
        technologyDirector: 'مدير التكنولوجيا',
        description1: 'شغوف بتقديم منتجات عالية الجودة للعملاء في الجزائر.',
        description2: 'يضمن سير العمليات بسلاسة وتجربة عملاء استثنائية.',
        description3: 'يقود مبادراتنا التقنية وتطوير المنصة.'
      },
      contactInfo: {
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        address: 'العنوان',
        businessHours: 'ساعات العمل',
        callUs: 'اتصل بنا',
        sendUsMessage: 'أرسل لنا رسالة',
        details: {
          phone: ['+213 XXX XXX XXX', '+213 YYY YYY YYY'],
          email: ['contact@eshop-algeria.com', 'support@eshop-algeria.com'],
          address: ['123 شارع رئيسي', 'الجزائر العاصمة، الجزائر'],
          businessHours: ['الإثنين-الجمعة: 9:00 ص - 6:00 م', 'السبت: 10:00 ص - 4:00 م']
        }
      },
      faq: {
        q1: 'كم يستغرق التوصيل؟',
        a1: 'عادةً ما يستغرق التوصيل من 2 إلى 5 أيام عمل حسب موقعك في الجزائر.',
        q2: 'ما هي طرق الدفع المتوفرة؟',
        a2: 'نقبل الدفع عند الاستلام، التحويلات البنكية، وجميع البطاقات الائتمانية الرئيسية.',
        q3: 'هل يمكنني إرجاع أو استبدال المنتجات؟',
        a3: 'نعم، نقدم سياسة إرجاع لمدة 30 يومًا لمعظم المنتجات بحالتها الأصلية.',
        q4: 'هل توصلون إلى جميع الولايات؟',
        a4: 'نعم، نقوم بالتوصيل إلى جميع الولايات الـ 48 في الجزائر.'
      },
      form: {
        productName: 'اسم المنتج',
        productNameAr: 'اسم المنتج (بالعربية)',
        description: 'الوصف',
        descriptionAr: 'الوصف (بالعربية)',
        categoryName: 'اسم الفئة',
        categoryNameAr: 'اسم الفئة (بالعربية)',
        price: 'السعر',
        stock: 'المخزون',
        image: 'الصورة',
        status: 'الحالة',
        actions: 'الإجراءات',
        view: 'عرض',
        edit: 'تعديل',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        create: 'إنشاء',
        update: 'تحديث',
        search: 'بحث',
        filter: 'تصفية',
        sort: 'ترتيب',
        export: 'تصدير',
        import: 'استيراد',
        bulkActions: 'إجراءات جماعية',
        selectAll: 'تحديد الكل',
        clearSelection: 'مسح التحديد'
      },
      messages: {
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        success: 'تمت العملية بنجاح',
        confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
        noData: 'لا توجد بيانات متاحة',
        noResults: 'لم يتم العثور على نتائج',
        retry: 'إعادة المحاولة',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        close: 'إغلاق',
        submit: 'إرسال',
        reset: 'إعادة تعيين'
      }
    }
  },

  fr: {
    nav: {
      home: 'Accueil',
      products: 'Produits',
      categories: 'Catégories',
      about: 'À propos',
      contact: 'Contact',
      cart: 'Panier',
      wishlist: 'Liste de souhaits',
      login: 'Connexion',
      logout: 'Déconnexion',
      profile: 'Profil',
      trackOrder: 'Suivre la commande',
      faq: 'FAQ'
    },

    common: {
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher des produits...',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      save: 'Enregistrer',
      edit: 'Modifier',
      delete: 'Supprimer',
      view: 'Voir',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      close: 'Fermer',
      submit: 'Soumettre',
      required: 'Requis',
      optional: 'Optionnel',
      currency: 'DA',
      outOfStock: 'Rupture de stock',
      inStock: 'En stock',
      sale: 'Promotion',
      new: 'Nouveau',
      featured: 'En vedette',
      bestseller: 'Meilleure vente',
      addToCart: 'Ajouter au panier',
      buyNow: 'Acheter maintenant',
      viewDetails: 'Voir les détails',
      shareProduct: 'Partager le produit',
      addToWishlist: 'Ajouter à la liste de souhaits',
      removeFromWishlist: 'Retirer de la liste de souhaits',
      quantity: 'Quantité',
      size: 'Taille',
      color: 'Couleur',
      price: 'Prix',
      total: 'Total',
      subtotal: 'Sous-total',
      deliveryFee: 'Frais de livraison',
      free: 'Gratuit',
      continueShopping: 'Continuer les achats',
      proceedToCheckout: 'Procéder au paiement',
      clearCart: 'Vider le panier',
      emptyCart: 'Votre panier est vide',
      itemsInCart: 'articles dans le panier',
      fullName: 'Nom complet',
      email: 'Email',
      phoneNumber: 'Numéro de téléphone',
      subject: 'Sujet',
      message: 'Message'
    },

    product: {
      description: 'Description',
      specifications: 'Spécifications',
      features: 'Caractéristiques',
      reviews: 'Avis',
      rating: 'Évaluation',
      reference: 'Référence',
      brand: 'Marque',
      category: 'Catégorie',
      availability: 'Disponibilité',
      warranty: 'Garantie',
      freeDelivery: 'Livraison gratuite',
      easyReturns: 'Retours faciles',
      securePayment: 'Paiement sécurisé',
      support247: 'Support 24/7',
      selectSize: 'Veuillez sélectionner une taille',
      selectColor: 'Veuillez sélectionner une couleur',
      maxQuantity: 'Max',
      productNotFound: 'Produit non trouvé',
      relatedProducts: 'Produits connexes',
      recentlyViewed: 'Vus récemment',
      launch: {
        availableNow: 'Disponible maintenant !',
        launchIn: 'Lancement dans :',
        comingSoon: 'Bientôt disponible',
        launchMode: 'Mode de lancement',
        launchDate: 'Date et heure de lancement',
        launchEnabled: 'Mode de lancement activé',
        launchDisabled: 'Mode de lancement désactivé'
      }
    },

    checkout: {
      title: 'Paiement',
      customerInfo: 'Informations client',
      deliveryOptions: 'Options de livraison',
      reviewOrder: 'Réviser la commande',
      orderSummary: 'Résumé de la commande',
      fullName: 'Nom complet',
      phoneNumber: 'Numéro de téléphone',
      email: 'Email',
      deliveryType: 'Type de livraison',
      homeDelivery: 'Livraison à domicile',
      pickupFromDesk: 'Retrait au bureau',
      city: 'Ville',
      address: 'Adresse',
      pickupLocation: 'Lieu de retrait',
      orderNotes: 'Notes de commande',
      paymentMethod: 'Méthode de paiement',
      cashOnDelivery: 'Paiement à la livraison',
      placeOrder: 'Passer la commande',
      placingOrder: 'Passage de la commande...',
      orderPlaced: 'Commande passée avec succès !',
      estimatedDelivery: 'Livraison estimée',
      orderConfirmation: 'Confirmation de commande',
      whatNext: 'Et maintenant ?',
      needHelp: 'Besoin d\'aide ?'
    },

    footer: {
      quickLinks: 'Liens rapides',
      customerService: 'Service client',
      contactInfo: 'Informations de contact',
      newsletter: 'Newsletter',
      subscribeNewsletter: 'Abonnez-vous à notre newsletter',
      enterEmail: 'Entrez votre email',
      subscribe: 'S\'abonner',
      followUs: 'Suivez-nous',
      allRightsReserved: 'Tous droits réservés',
      privacyPolicy: 'Politique de confidentialité',
      termsOfService: 'Conditions de service',
      cookiePolicy: 'Politique des cookies',
      freeShipping: 'Livraison gratuite',
      securePayment: 'Paiement sécurisé',
      support247: 'Support 24/7',
      easyReturns: 'Retours faciles'
    },

    pages: {
      home: {
        heroTitle: 'Achetez le meilleur',
        heroSubtitle: 'Découvrez des produits incroyables avec une livraison rapide dans toute l\'Algérie',
        shopNow: 'Acheter maintenant',
        shopByCategory: 'Acheter par catégorie',
        featuredProducts: 'Produits en vedette',
        stayUpdated: 'Restez informé',
        newsletterText: 'Abonnez-vous à notre newsletter et soyez le premier à connaître les nouveaux produits et offres exclusives'
      },

      loudBrands: {
        whoWeAre: 'Qui nous sommes',
        ourStory: 'Notre histoire',
        ourValues: 'Nos valeurs',
        loudBrands: 'LOUD Brands',
        fromHeart: 'Du cœur de l\'Algérie, nous redéfinissons l\'élégance avec un style qui allie modernité et authenticité.',
        leadingBrand: 'Nous sommes une marque algérienne leader spécialisée dans la conception et la production de vêtements d\'occasion et de tous les jours, à travers deux branches distinctes :',
        loudStylesDesc: 'Robes de mariée et tenues de soirée luxueuses.',
        loudimDesc: 'Vêtements d\'extérieur élégants et vêtements décontractés sophistiqués.',
        proudAlgerian: 'Nous sommes ici pour offrir aux femmes algériennes des choix locaux qui rivalisent puissamment avec les marques internationales—avec une fierté totale, nous sommes 100% algériens.',
        storyBegin: 'LOUD Brands a commencé comme un simple rêve : créer une mode locale qui reflète l\'identité de la femme algérienne et répond à son goût raffiné pour chaque occasion.',
        storyJourney: 'D\'une robe de mariée qui immortalise le grand moment de la vie à un look décontracté qui reflète votre moi quotidien—notre parcours a été rempli de passion, de design et d\'engagement envers la qualité.',
        storyInnovation: 'Nous avons choisi d\'être différents... alors nous avons innové en créant deux branches pour répondre à chaque aspect de votre vie :',
        loudStylesPurpose: 'Pour chaque grand moment, un look digne de vous.',
        loudimPurpose: 'Pour chaque jour, une élégance qui vous convient.',
        storyToday: 'Aujourd\'hui, nous sommes fiers d\'être une marque algérienne qui fait la différence à chaque pas.',
        qualityFirst: 'Qualité d\'abord',
        qualityFirstDesc: 'De la sélection du tissu au point final, nous privilégions les plus petits détails.',
        refinedElegance: 'Élégance raffinée',
        refinedEleganceDesc: 'Nous concevons des pièces qui reflètent votre personnalité, avec une vision contemporaine et une touche algérienne.',
        localIndustry: 'Autonomiser l\'industrie locale',
        localIndustryDesc: 'Notre fierté ultime est d\'être une production 100% algérienne.',
        boldness: 'Audace et distinction',
        boldnessDesc: 'Nous croyons que chaque femme mérite d\'être unique et différente.',
        innovation: 'Innovation continue',
        innovationDesc: 'Nous suivons les dernières lignes de mode et les adaptons à votre goût local.',
        exploreLoudim: 'Explorez LOUDIM',
        exploreLoudStyles: 'Explorez LOUD STYLES',
        loudimTagline: 'La collection LOUDIM allie élégance et confort, conçue pour la femme moderne qui recherche la distinction à chaque occasion.',
        loudStylesTagline: 'La collection LOUD STYLES incarne le luxe et la sophistication, conçue pour la femme qui exige l\'excellence à chaque moment.'
      },

      about: {
        title: 'À propos d\'E-Shop Algérie',
        subtitle: 'Nous avons pour mission de révolutionner le shopping en ligne en Algérie',
        ourStory: 'Notre histoire',
        ourValues: 'Nos valeurs',
        meetOurTeam: 'Rencontrez notre équipe',
        ourMission: 'Notre mission',
        customerFirst: 'Client d\'abord',
        qualityAssurance: 'Assurance qualité',
        fastDelivery: 'Livraison rapide',
        excellence: 'Excellence'
      },

      contact: {
        title: 'Contactez-nous',
        subtitle: 'Nous sommes là pour vous aider ! Contactez-nous pour toute question, préoccupation ou commentaire.',
        sendMessage: 'Envoyez-nous un message',
        faq: 'Questions fréquemment posées',
        phone: 'Téléphone',
        email: 'Email',
        address: 'Adresse',
        businessHours: 'Heures d\'ouverture',
        stillHaveQuestions: 'Vous avez encore des questions ?',
        callUs: 'Appelez-nous',
        sendUsMessage: 'Envoyez-nous un message'
      },

      faq: {
        title: 'Questions fréquemment posées',
        subtitle: 'Trouvez des réponses aux questions courantes sur les achats, la livraison, les retours et plus encore.',
        searchAnswers: 'Rechercher des réponses...',
        allCategories: 'Toutes les catégories',
        ordersDelivery: 'Commandes et livraison',
        paymentPricing: 'Paiement et prix',
        returnsExchanges: 'Retours et échanges',
        accountSecurity: 'Compte et sécurité',
        productsQuality: 'Produits et qualité',
        noResults: 'Aucun résultat trouvé',
        clearSearch: 'Effacer la recherche'
      },

      trackOrder: {
        title: 'Suivre votre commande',
        subtitle: 'Entrez votre numéro de commande pour suivre votre colis et voir les mises à jour en temps réel',
        orderNumber: 'Numéro de commande',
        trackOrder: 'Suivre la commande',
        searching: 'Recherche...',
        orderFound: 'Commande trouvée !',
        orderNotFound: 'Commande non trouvée. Veuillez vérifier votre numéro de commande.',
        orderDetails: 'Détails de la commande',
        trackingTimeline: 'Chronologie de suivi',
        orderItems: 'Articles de la commande'
      },

      wishlist: {
        title: 'Ma liste de souhaits',
        subtitle: 'Gardez une trace des articles que vous aimez et que vous voulez acheter plus tard',
        emptyWishlist: 'Votre liste de souhaits est vide',
        emptyWishlistText: 'Commencez à ajouter des articles à votre liste de souhaits en cliquant sur l\'icône cœur sur les produits que vous aimez',
        startShopping: 'Commencer les achats',
        shareWishlist: 'Partager la liste de souhaits',
        addAllToCart: 'Tout ajouter au panier',
        youMightLike: 'Vous pourriez aussi aimer',
        exploreMore: 'Explorer plus de produits',
        addedOn: 'Ajouté le'
      }
    },

    admin: {
      dashboard: 'Tableau de bord',
      products: 'Produits',
      inventory: 'Inventaire',
      orders: 'Commandes',
      shipping: 'Expédition',
      categories: 'Catégories',
      users: 'Utilisateurs',
      analytics: 'Analyses',
      settings: 'Paramètres',
      customerCalls: 'Appels clients',
      orderProcessing: 'Traitement des commandes',
      deliveryAreas: 'Zones de livraison',
      logout: 'Déconnexion',
      roleNames: {
        ADMIN: 'Administrateur',
        SUPERADMIN: 'Super administrateur',
        CALL_CENTER: 'Agent du centre d\'appels',
        ORDER_CONFIRMATION: 'Traiteur de commandes',
        DELIVERY_COORDINATOR: 'Agent de livraison',
        USER: 'Utilisateur'
      },
      sidebarTitle: 'Tableau de bord Loudim',
      stats: {
        happyCustomers: 'Clients satisfaits',
        productsSold: 'Produits vendus',
        citiesCovered: 'Villes couvertes',
        yearsExperience: 'Années d\'expérience'
      },
      values: {
        customerFirst: 'Client d\'abord',
        qualityAssurance: 'Assurance qualité',
        fastDelivery: 'Livraison rapide',
        excellence: 'Excellence'
      },
      team: {
        meetOurTeam: 'Rencontrez notre équipe',
        founder: 'Fondateur et PDG',
        headOfOperations: 'Chef des opérations',
        technologyDirector: 'Directeur technologique',
        description1: 'Passionné par l\'apport de produits de qualité aux clients algériens.',
        description2: 'Assure des opérations fluides et une expérience client exceptionnelle.',
        description3: 'Dirige nos initiatives technologiques et le développement de la plateforme.'
      },
      contactInfo: {
        phone: 'Téléphone',
        email: 'Email',
        address: 'Adresse',
        businessHours: 'Heures d\'ouverture',
        callUs: 'Appelez-nous',
        sendUsMessage: 'Envoyez-nous un message',
        details: {
          phone: ['+213 XXX XXX XXX', '+213 YYY YYY YYY'],
          email: ['contact@eshop-algeria.com', 'support@eshop-algeria.com'],
          address: ['123 Rue Principale', 'Alger, Algérie'],
          businessHours: ['Lun-Ven: 9h00 - 18h00', 'Sam: 10h00 - 16h00']
        }
      },
      faq: {
        q1: 'Combien de temps prend la livraison ?',
        a1: 'La livraison prend généralement 2 à 5 jours ouvrables selon votre emplacement en Algérie.',
        q2: 'Quelles méthodes de paiement acceptez-vous ?',
        a2: 'Nous acceptons le paiement à la livraison, les virements bancaires et les principales cartes de crédit.',
        q3: 'Puis-je retourner ou échanger des articles ?',
        a3: 'Oui, nous offrons une politique de retour de 30 jours pour la plupart des articles dans leur état d\'origine.',
        q4: 'Livrez-vous dans toutes les wilayas ?',
        a4: 'Oui, nous livrons dans les 48 wilayas d\'Algérie.'
      },
      form: {
        productName: 'Nom du produit',
        productNameAr: 'Nom du produit (arabe)',
        description: 'Description',
        descriptionAr: 'Description (arabe)',
        categoryName: 'Nom de la catégorie',
        categoryNameAr: 'Nom de la catégorie (arabe)',
        price: 'Prix',
        stock: 'Stock',
        image: 'Image',
        status: 'Statut',
        actions: 'Actions',
        view: 'Voir',
        edit: 'Modifier',
        delete: 'Supprimer',
        save: 'Enregistrer',
        cancel: 'Annuler',
        create: 'Créer',
        update: 'Mettre à jour',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        export: 'Exporter',
        import: 'Importer',
        bulkActions: 'Actions en lot',
        selectAll: 'Tout sélectionner',
        clearSelection: 'Effacer la sélection'
      },
      messages: {
        loading: 'Chargement...',
        error: 'Une erreur s\'est produite',
        success: 'Opération terminée avec succès',
        confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
        noData: 'Aucune donnée disponible',
        noResults: 'Aucun résultat trouvé',
        retry: 'Réessayer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        close: 'Fermer',
        submit: 'Soumettre',
        reset: 'Réinitialiser'
      }
    }
  }
}

// Utility functions
export function getTranslation(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale]
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar'
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

export function formatCurrency(amount: number, locale: Locale): string {
  const t = getTranslation(locale)
  return `${amount.toLocaleString()} ${t.common.currency}`
}
