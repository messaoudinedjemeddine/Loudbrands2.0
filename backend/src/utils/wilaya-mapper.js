/**
 * Wilaya Name Mapper Utility
 * Handles mapping between wilaya IDs, names, and different naming conventions
 * used by the website, database, and Yalidine API
 */

// Complete mapping for all 58 Algerian wilayas
const WILAYA_MAPPING = {
  1: { 
    name: 'Adrar', 
    nameAr: 'أدرار', 
    code: '01',
    alternatives: ['Adrar', 'أدرار']
  },
  2: { 
    name: 'Chlef', 
    nameAr: 'الشلف', 
    code: '02',
    alternatives: ['Chlef', 'El Asnam', 'الشلف']
  },
  3: { 
    name: 'Laghouat', 
    nameAr: 'الأغواط', 
    code: '03',
    alternatives: ['Laghouat', 'الأغواط', 'Laghouate']
  },
  4: { 
    name: 'Oum El Bouaghi', 
    nameAr: 'أم البواقي', 
    code: '04',
    alternatives: ['Oum El Bouaghi', 'أم البواقي', 'Oum el Bouaghi']
  },
  5: { 
    name: 'Batna', 
    nameAr: 'باتنة', 
    code: '05',
    alternatives: ['Batna', 'باتنة']
  },
  6: { 
    name: 'Bejaia', 
    nameAr: 'بجاية', 
    code: '06',
    alternatives: ['Bejaia', 'Béjaïa', 'بجاية', 'Bejaïa']
  },
  7: { 
    name: 'Biskra', 
    nameAr: 'بسكرة', 
    code: '07',
    alternatives: ['Biskra', 'بسكرة']
  },
  8: { 
    name: 'Bechar', 
    nameAr: 'بشار', 
    code: '08',
    alternatives: ['Bechar', 'Béchar', 'بشار']
  },
  9: { 
    name: 'Blida', 
    nameAr: 'البليدة', 
    code: '09',
    alternatives: ['Blida', 'البليدة']
  },
  10: { 
    name: 'Bouira', 
    nameAr: 'البويرة', 
    code: '10',
    alternatives: ['Bouira', 'البويرة']
  },
  11: { 
    name: 'Tamanrasset', 
    nameAr: 'تمنراست', 
    code: '11',
    alternatives: ['Tamanrasset', 'تمنراست', 'Tamanghasset']
  },
  12: { 
    name: 'Tebessa', 
    nameAr: 'تبسة', 
    code: '12',
    alternatives: ['Tebessa', 'Tébessa', 'تبسة']
  },
  13: { 
    name: 'Tlemcen', 
    nameAr: 'تلمسان', 
    code: '13',
    alternatives: ['Tlemcen', 'تلمسان']
  },
  14: { 
    name: 'Tiaret', 
    nameAr: 'تيارت', 
    code: '14',
    alternatives: ['Tiaret', 'تيارت']
  },
  15: { 
    name: 'Tizi Ouzou', 
    nameAr: 'تيزي وزو', 
    code: '15',
    alternatives: ['Tizi Ouzou', 'تيزي وزو']
  },
  16: { 
    name: 'Algiers', 
    nameAr: 'الجزائر', 
    code: '16',
    alternatives: ['Algiers', 'Alger', 'الجزائر']
  },
  17: { 
    name: 'Djelfa', 
    nameAr: 'الجلفة', 
    code: '17',
    alternatives: ['Djelfa', 'الجلفة']
  },
  18: { 
    name: 'Jijel', 
    nameAr: 'جيجل', 
    code: '18',
    alternatives: ['Jijel', 'جيجل']
  },
  19: { 
    name: 'Setif', 
    nameAr: 'سطيف', 
    code: '19',
    alternatives: ['Setif', 'Sétif', 'سطيف']
  },
  20: { 
    name: 'Saida', 
    nameAr: 'سعيدة', 
    code: '20',
    alternatives: ['Saida', 'Saïda', 'سعيدة']
  },
  21: { 
    name: 'Skikda', 
    nameAr: 'سكيكدة', 
    code: '21',
    alternatives: ['Skikda', 'سكيكدة']
  },
  22: { 
    name: 'Sidi Bel Abbes', 
    nameAr: 'سيدي بلعباس', 
    code: '22',
    alternatives: ['Sidi Bel Abbes', 'Sidi Bel Abbès', 'سيدي بلعباس']
  },
  23: { 
    name: 'Annaba', 
    nameAr: 'عنابة', 
    code: '23',
    alternatives: ['Annaba', 'عنابة']
  },
  24: { 
    name: 'Guelma', 
    nameAr: 'قالمة', 
    code: '24',
    alternatives: ['Guelma', 'قالمة']
  },
  25: { 
    name: 'Constantine', 
    nameAr: 'قسنطينة', 
    code: '25',
    alternatives: ['Constantine', 'قسنطينة']
  },
  26: { 
    name: 'Medea', 
    nameAr: 'المدية', 
    code: '26',
    alternatives: ['Medea', 'Médéa', 'المدية']
  },
  27: { 
    name: 'Mostaganem', 
    nameAr: 'مستغانم', 
    code: '27',
    alternatives: ['Mostaganem', 'مستغانم']
  },
  28: { 
    name: 'Msila', 
    nameAr: 'المسيلة', 
    code: '28',
    alternatives: ['Msila', 'M\'Sila', 'المسيلة']
  },
  29: { 
    name: 'Mascara', 
    nameAr: 'معسكر', 
    code: '29',
    alternatives: ['Mascara', 'معسكر']
  },
  30: { 
    name: 'Ouargla', 
    nameAr: 'ورقلة', 
    code: '30',
    alternatives: ['Ouargla', 'ورقلة']
  },
  31: { 
    name: 'Oran', 
    nameAr: 'وهران', 
    code: '31',
    alternatives: ['Oran', 'وهران']
  },
  32: { 
    name: 'El Bayadh', 
    nameAr: 'البيض', 
    code: '32',
    alternatives: ['El Bayadh', 'البيض']
  },
  33: { 
    name: 'Illizi', 
    nameAr: 'إليزي', 
    code: '33',
    alternatives: ['Illizi', 'إليزي']
  },
  34: { 
    name: 'Bordj Bou Arreridj', 
    nameAr: 'برج بوعريريج', 
    code: '34',
    alternatives: ['Bordj Bou Arreridj', 'Bordj Bou Arréridj', 'برج بوعريريج']
  },
  35: { 
    name: 'Boumerdes', 
    nameAr: 'بومرداس', 
    code: '35',
    alternatives: ['Boumerdes', 'Boumerdès', 'بومرداس']
  },
  36: { 
    name: 'El Tarf', 
    nameAr: 'الطارف', 
    code: '36',
    alternatives: ['El Tarf', 'الطارف']
  },
  37: { 
    name: 'Tindouf', 
    nameAr: 'تندوف', 
    code: '37',
    alternatives: ['Tindouf', 'تندوف']
  },
  38: { 
    name: 'Tissemsilt', 
    nameAr: 'تيسمسيلت', 
    code: '38',
    alternatives: ['Tissemsilt', 'تيسمسيلت']
  },
  39: { 
    name: 'El Oued', 
    nameAr: 'الوادي', 
    code: '39',
    alternatives: ['El Oued', 'الوادي']
  },
  40: { 
    name: 'Khenchela', 
    nameAr: 'خنشلة', 
    code: '40',
    alternatives: ['Khenchela', 'خنشلة']
  },
  41: { 
    name: 'Souk Ahras', 
    nameAr: 'سوق أهراس', 
    code: '41',
    alternatives: ['Souk Ahras', 'سوق أهراس']
  },
  42: { 
    name: 'Tipaza', 
    nameAr: 'تيبازة', 
    code: '42',
    alternatives: ['Tipaza', 'تيبازة']
  },
  43: { 
    name: 'Mila', 
    nameAr: 'ميلة', 
    code: '43',
    alternatives: ['Mila', 'ميلة']
  },
  44: { 
    name: 'Ain Defla', 
    nameAr: 'عين الدفلى', 
    code: '44',
    alternatives: ['Ain Defla', 'Aïn Defla', 'عين الدفلى']
  },
  45: { 
    name: 'Naama', 
    nameAr: 'النعامة', 
    code: '45',
    alternatives: ['Naama', 'Naâma', 'النعامة']
  },
  46: { 
    name: 'Ain Temouchent', 
    nameAr: 'عين تموشنت', 
    code: '46',
    alternatives: ['Ain Temouchent', 'Aïn Témouchent', 'عين تموشنت']
  },
  47: { 
    name: 'Ghardaia', 
    nameAr: 'غرداية', 
    code: '47',
    alternatives: ['Ghardaia', 'Ghardaïa', 'غرداية']
  },
  48: { 
    name: 'Relizane', 
    nameAr: 'غليزان', 
    code: '48',
    alternatives: ['Relizane', 'غليزان']
  },
  49: { 
    name: 'Timimoun', 
    nameAr: 'تيميمون', 
    code: '49',
    alternatives: ['Timimoun', 'تيميمون']
  },
  50: { 
    name: 'Bordj Badji Mokhtar', 
    nameAr: 'برج باجي مختار', 
    code: '50',
    alternatives: ['Bordj Badji Mokhtar', 'برج باجي مختار']
  },
  51: { 
    name: 'Ouled Djellal', 
    nameAr: 'أولاد جلال', 
    code: '51',
    alternatives: ['Ouled Djellal', 'أولاد جلال']
  },
  52: { 
    name: 'Beni Abbes', 
    nameAr: 'بني عباس', 
    code: '52',
    alternatives: ['Beni Abbes', 'Béni Abbès', 'بني عباس']
  },
  53: { 
    name: 'In Salah', 
    nameAr: 'عين صالح', 
    code: '53',
    alternatives: ['In Salah', 'عين صالح']
  },
  54: { 
    name: 'In Guezzam', 
    nameAr: 'عين قزام', 
    code: '54',
    alternatives: ['In Guezzam', 'عين قزام']
  },
  55: { 
    name: 'Touggourt', 
    nameAr: 'تقرت', 
    code: '55',
    alternatives: ['Touggourt', 'تقرت']
  },
  56: { 
    name: 'Djanet', 
    nameAr: 'جانت', 
    code: '56',
    alternatives: ['Djanet', 'جانت']
  },
  57: { 
    name: 'Msila', 
    nameAr: 'المسيلة', 
    code: '57',
    alternatives: ['Msila', 'M\'Sila', 'المسيلة']
  },
  58: { 
    name: 'El M\'Ghair', 
    nameAr: 'المغير', 
    code: '58',
    alternatives: ['El M\'Ghair', 'المغير']
  }
};

/**
 * Get wilaya information by ID
 * @param {number} wilayaId - The wilaya ID
 * @returns {Object|null} - Wilaya information or null if not found
 */
function getWilayaById(wilayaId) {
  return WILAYA_MAPPING[wilayaId] || null;
}

/**
 * Get wilaya information by name (case-insensitive)
 * @param {string} name - The wilaya name
 * @returns {Object|null} - Wilaya information or null if not found
 */
function getWilayaByName(name) {
  if (!name) return null;
  
  const searchName = name.toLowerCase().trim();
  
  for (const [id, wilaya] of Object.entries(WILAYA_MAPPING)) {
    if (wilaya.alternatives.some(alt => alt.toLowerCase() === searchName)) {
      return { id: parseInt(id), ...wilaya };
    }
  }
  
  return null;
}

/**
 * Get the standard name for a wilaya by ID
 * @param {number} wilayaId - The wilaya ID
 * @returns {string|null} - Standard wilaya name or null if not found
 */
function getWilayaName(wilayaId) {
  const wilaya = getWilayaById(wilayaId);
  return wilaya ? wilaya.name : null;
}

/**
 * Get the Arabic name for a wilaya by ID
 * @param {number} wilayaId - The wilaya ID
 * @returns {string|null} - Arabic wilaya name or null if not found
 */
function getWilayaNameAr(wilayaId) {
  const wilaya = getWilayaById(wilayaId);
  return wilaya ? wilaya.nameAr : null;
}

/**
 * Get all wilayas as an array
 * @returns {Array} - Array of all wilayas with their information
 */
function getAllWilayas() {
  return Object.entries(WILAYA_MAPPING).map(([id, wilaya]) => ({
    id: parseInt(id),
    ...wilaya
  }));
}

/**
 * Validate if a wilaya ID is valid
 * @param {number} wilayaId - The wilaya ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidWilayaId(wilayaId) {
  return wilayaId >= 1 && wilayaId <= 58 && WILAYA_MAPPING[wilayaId];
}

module.exports = {
  WILAYA_MAPPING,
  getWilayaById,
  getWilayaByName,
  getWilayaName,
  getWilayaNameAr,
  getAllWilayas,
  isValidWilayaId
};
