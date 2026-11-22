import { UniversityCampus } from '../../types/database.types';

/**
 * Official Regional Campuses and Geographic Branches of Egyptian Universities
 * Source: Supreme Council of Universities & Ministry of Higher Education Egypt
 */
export const INITIAL_CAMPUSES: UniversityCampus[] = [
  // Al-Azhar University Campuses
  {
    id: 'camp-azhar-cairo',
    university_id: 'uni-azhar',
    name_ar: 'المقر الرئيسي وفرع القاهرة (مدينة نصر / الدراسة)',
    name_en: 'Main Campus & Cairo Branch (Nasr City / Darrasa)',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة نصر',
    city_en: 'Nasr City',
    is_main_campus: true
  },
  {
    id: 'camp-azhar-damietta',
    university_id: 'uni-azhar',
    name_ar: 'فرع دمياط الجديدة',
    name_en: 'New Damietta Campus',
    governorate_ar: 'دمياط',
    governorate_en: 'Damietta',
    city_ar: 'دمياط الجديدة',
    city_en: 'New Damietta',
    is_main_campus: false
  },
  {
    id: 'camp-azhar-assiut',
    university_id: 'uni-azhar',
    name_ar: 'فرع أسيوط والوجه القبلي',
    name_en: 'Assiut & Upper Egypt Campus',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    city_ar: 'أسيوط',
    city_en: 'Assiut',
    is_main_campus: false
  },
  {
    id: 'camp-azhar-delta',
    university_id: 'uni-azhar',
    name_ar: 'فرع الوجه البحري والدلتا (طنطا / الزقازيق / المنصورة / دمنهور)',
    name_en: 'Lower Egypt & Delta Campuses (Tanta, Zagazig, Mansoura, Damanhour)',
    governorate_ar: 'الغربية',
    governorate_en: 'Gharbia',
    city_ar: 'طنطا',
    city_en: 'Tanta',
    is_main_campus: false
  },

  // Cairo University Campuses
  {
    id: 'camp-cu-giza',
    university_id: 'uni-cu',
    name_ar: 'الحرم الجامعي الرئيسي بالجيزة',
    name_en: 'Main Giza Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: 'الأورمان / الدقي',
    city_en: 'Orman / Dokki',
    is_main_campus: true
  },
  {
    id: 'camp-cu-kasralainy',
    university_id: 'uni-cu',
    name_ar: 'المجمع الطبي بقصر العيني والمنيل',
    name_en: 'Kasr Al-Ainy & Manyal Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'المنيل / قصر العيني',
    city_en: 'Manyal / Kasr Al-Ainy',
    is_main_campus: false
  },
  {
    id: 'camp-cu-zayed',
    university_id: 'uni-cu',
    name_ar: 'فرع الشيخ زايد وجامعة القاهرة الدولية',
    name_en: 'Sheikh Zayed & Cairo University International Branch',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: 'الشيخ زايد',
    city_en: 'Sheikh Zayed',
    is_main_campus: false
  },

  // Ain Shams Campuses
  {
    id: 'camp-asu-abbassia',
    university_id: 'uni-asu',
    name_ar: 'الحرم الرئيسي بالعباسية',
    name_en: 'Main Abbassia Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العباسية',
    city_en: 'Abbassia',
    is_main_campus: true
  },
  {
    id: 'camp-asu-obour',
    university_id: 'uni-asu',
    name_ar: 'فرع مدينة العبور',
    name_en: 'Obour City Campus',
    governorate_ar: 'القليوبية',
    governorate_en: 'Qalyubia',
    city_ar: 'مدينة العبور',
    city_en: 'Obour City',
    is_main_campus: false
  },

  // Alexandria Campuses
  {
    id: 'camp-alex-chatby',
    university_id: 'uni-alex',
    name_ar: 'مجمع الشاطبي وسوتير',
    name_en: 'Chatby & Soter Campus',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'الشاطبي',
    city_en: 'Chatby',
    is_main_campus: true
  },
  {
    id: 'camp-alex-sababasha',
    university_id: 'uni-alex',
    name_ar: 'مجمع سابا باشا / جناكليس',
    name_en: 'Saba Basha Campus',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'سابا باشا',
    city_en: 'Saba Basha',
    is_main_campus: false
  },

  // Helwan Campuses
  {
    id: 'camp-helwan-ainhelwan',
    university_id: 'uni-helwan',
    name_ar: 'الحرم الرئيسي بعين حلوان',
    name_en: 'Main Ain Helwan Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'عين حلوان',
    city_en: 'Ain Helwan',
    is_main_campus: true
  },
  {
    id: 'camp-helwan-mataria',
    university_id: 'uni-helwan',
    name_ar: 'مجمع المطرية الهندسي',
    name_en: 'Mataria Engineering Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'المطرية',
    city_en: 'Mataria',
    is_main_campus: false
  },
  {
    id: 'camp-helwan-zamalek',
    university_id: 'uni-helwan',
    name_ar: 'مجمع الفنون بالزمالك',
    name_en: 'Zamalek Fine Arts Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'الزمالك',
    city_en: 'Zamalek',
    is_main_campus: false
  },

  // King Salman International University Campuses (3 Branches)
  {
    id: 'camp-ksiu-sharm',
    university_id: 'uni-salman',
    name_ar: 'فرع شرم الشيخ (السياحة واللغات والفنون والتصميم)',
    name_en: 'Sharm El-Sheikh Campus',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    city_ar: 'شرم الشيخ',
    city_en: 'Sharm El-Sheikh',
    is_main_campus: true
  },
  {
    id: 'camp-ksiu-tor',
    university_id: 'uni-salman',
    name_ar: 'فرع الطور (الطب وطب الأسنان والهندسة والصناعات التكنولوجية)',
    name_en: 'Tor Sinai Campus (Medicine & Engineering)',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    city_ar: 'الطور',
    city_en: 'Tor Sinai',
    is_main_campus: false
  },
  {
    id: 'camp-ksiu-sudr',
    university_id: 'uni-salman',
    name_ar: 'فرع رأس سدر (العلوم الإدارية والزراعات الصحراوية والطب البيطري)',
    name_en: 'Ras Sudr Campus (Desert Agriculture & Vet)',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    city_ar: 'رأس سدر',
    city_en: 'Ras Sudr',
    is_main_campus: false
  }
];
