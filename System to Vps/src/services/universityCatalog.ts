import { University, UniversityFaculty, UniversityType, AcademicSpecialization, UniversityCampus } from '../types/database.types';
import { INITIAL_CAMPUSES, getAllAccreditedFaculties } from './academic';

export { INITIAL_CAMPUSES };

/**
 * Normalizes Arabic text for academic entity searching:
 * - Unifies Alef variants: أ, إ, آ, ٱ -> ا
 * - Unifies Taa Marbuta: ة -> ه
 * - Unifies Yaa / Alef Maqsura: ى -> ي
 * - Strips Arabic diacritics (tashkeel, tatweel)
 * - Trims and collapses multiple spaces into a single space
 * - Lowercases English text
 */
export function normalizeAcademicSearch(text?: string | null): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel/tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

/**
 * Instant search engine for Egyptian universities:
 * - Real-time matching without button presses
 * - Search by Arabic or English name or substring
 * - Hamza/spelling normalization
 * - Governorate and city search support
 * - Deduplication guaranteed
 * - Multi-category classification filtering
 */
export function searchUniversities(
  universities: University[],
  queryOrOptions: string | { query?: string; type?: string; governorate?: string } = '',
  typeFilter: string = 'all'
): University[] {
  let queryText = '';
  let activeType = typeFilter;
  let activeGov = '';

  if (typeof queryOrOptions === 'object' && queryOrOptions !== null) {
    queryText = queryOrOptions.query || '';
    activeType = queryOrOptions.type || 'all';
    activeGov = queryOrOptions.governorate || '';
  } else {
    queryText = queryOrOptions || '';
  }

  const normQuery = normalizeAcademicSearch(queryText);
  const normGovFilter = normalizeAcademicSearch(activeGov);

  const matched = universities.filter(u => {
    // 1. Classification Filter
    if (activeType && activeType !== 'all' && u.type !== activeType) {
      return false;
    }

    // 2. Governorate Filter (if specified)
    if (normGovFilter) {
      const gAr = normalizeAcademicSearch(u.governorate_ar);
      const gEn = normalizeAcademicSearch(u.governorate_en);
      if (!gAr.includes(normGovFilter) && !gEn.includes(normGovFilter)) {
        return false;
      }
    }

    // 3. Text Search
    if (!normQuery) return true;

    const normNameAr = normalizeAcademicSearch(u.name_ar);
    const normNameEn = normalizeAcademicSearch(u.name_en);
    const normGovAr = normalizeAcademicSearch(u.governorate_ar);
    const normGovEn = normalizeAcademicSearch(u.governorate_en);
    const normCityAr = normalizeAcademicSearch(u.city_ar);
    const normCityEn = normalizeAcademicSearch(u.city_en);

    return (
      normNameAr.includes(normQuery) ||
      normNameEn.includes(normQuery) ||
      normGovAr.includes(normQuery) ||
      normGovEn.includes(normQuery) ||
      normCityAr.includes(normQuery) ||
      normCityEn.includes(normQuery) ||
      (u.website_url && u.website_url.toLowerCase().includes(normQuery)) ||
      (u.website && u.website.toLowerCase().includes(normQuery))
    );
  });

  // Deduplicate by ID
  const seen = new Set<string>();
  const deduped: University[] = [];
  for (const u of matched) {
    if (!seen.has(u.id)) {
      seen.add(u.id);
      deduped.push(u);
    }
  }

  return deduped;
}

// ============================================================================
// COMPREHENSIVE ACCREDITED EGYPTIAN UNIVERSITIES DATABASE
// Official Source: Supreme Council of Universities (SCU) & MoHESR Egypt
// ============================================================================

export const INITIAL_UNIVERSITIES: University[] = [
  // --------------------------------------------------------------------------
  // A. Public Universities (الجامعات الحكومية المصرية المعتمدة)
  // --------------------------------------------------------------------------
  {
    id: 'uni-cu',
    name_ar: 'جامعة القاهرة',
    name_en: 'Cairo University',
    type: 'public',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: 'الجيزة / قصر العيني',
    city_en: 'Giza / Kasr Al-Ainy',
    address_ar: 'شارع الجامعة، الأورمان، الجيزة',
    website_url: 'https://cu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1908,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-asu',
    name_ar: 'جامعة عين شمس',
    name_en: 'Ain Shams University',
    type: 'public',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العباسية',
    city_en: 'Abbassia',
    address_ar: 'شارع الخليفة المأمون، العباسية، القاهرة',
    website_url: 'https://asu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1950,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-alex',
    name_ar: 'جامعة الإسكندرية',
    name_en: 'Alexandria University',
    type: 'public',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'الشاطبي',
    city_en: 'Chatby',
    address_ar: 'طريق الجيش، الشاطبي، الإسكندرية',
    website_url: 'https://alexu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1938,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-mans',
    name_ar: 'جامعة المنصورة',
    name_en: 'Mansoura University',
    type: 'public',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    city_ar: 'المنصورة',
    city_en: 'Mansoura',
    address_ar: 'شارع الجمهورية، المنصورة، الدقهلية',
    website_url: 'https://mans.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1972,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-assiut',
    name_ar: 'جامعة أسيوط',
    name_en: 'Assiut University',
    type: 'public',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    city_ar: 'أسيوط',
    city_en: 'Assiut City',
    address_ar: 'مجمع الكليات، أسيوط',
    website_url: 'https://aun.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1957,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-zag',
    name_ar: 'جامعة الزقازيق',
    name_en: 'Zagazig University',
    type: 'public',
    governorate_ar: 'الشرقية',
    governorate_en: 'Sharqia',
    city_ar: 'الزقازيق',
    city_en: 'Zagazig',
    address_ar: 'شارع الجامعة، الزقازيق، الشرقية',
    website_url: 'https://zu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1974,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-helwan',
    name_ar: 'جامعة حلوان',
    name_en: 'Helwan University',
    type: 'public',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'عين حلوان',
    city_en: 'Ain Helwan',
    address_ar: 'طريق الأوتوستراد، عين حلوان، القاهرة',
    website_url: 'https://helwan.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1975,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-tanta',
    name_ar: 'جامعة طنطا',
    name_en: 'Tanta University',
    type: 'public',
    governorate_ar: 'الغربية',
    governorate_en: 'Gharbia',
    city_ar: 'طنطا',
    city_en: 'Tanta',
    address_ar: 'شارع الجيش، طنطا، الغربية',
    website_url: 'https://tanta.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1972,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-suez-canal',
    name_ar: 'جامعة قناة السويس',
    name_en: 'Suez Canal University',
    type: 'public',
    governorate_ar: 'الإسماعيلية',
    governorate_en: 'Ismailia',
    city_ar: 'الإسماعيلية',
    city_en: 'Ismailia',
    address_ar: 'الكيلو 4.5، الطريق الدائري، الإسماعيلية',
    website_url: 'https://scuegypt.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1976,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-benha',
    name_ar: 'جامعة بنها',
    name_en: 'Benha University',
    type: 'public',
    governorate_ar: 'القليوبية',
    governorate_en: 'Qalyubia',
    city_ar: 'بنها',
    city_en: 'Benha',
    address_ar: 'شارع فريد ندا، بنها، القليوبية',
    website_url: 'https://bu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1976,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-fayoum',
    name_ar: 'جامعة الفيوم',
    name_en: 'Fayoum University',
    type: 'public',
    governorate_ar: 'الفيوم',
    governorate_en: 'Fayoum',
    city_ar: 'الفيوم',
    city_en: 'Fayoum City',
    address_ar: 'باغوص، الفيوم',
    website_url: 'https://fayoum.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2005,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-bsu',
    name_ar: 'جامعة بني سويف',
    name_en: 'Beni Suef University',
    type: 'public',
    governorate_ar: 'بني سويف',
    governorate_en: 'Beni Suef',
    city_ar: 'بني سويف',
    city_en: 'Beni Suef City',
    address_ar: 'شارع صلاح سالم، بني سويف',
    website_url: 'https://bsu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2005,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-kfs',
    name_ar: 'جامعة كفر الشيخ',
    name_en: 'Kafrelsheikh University',
    type: 'public',
    governorate_ar: 'كفر الشيخ',
    governorate_en: 'Kafr El Sheikh',
    city_ar: 'كفر الشيخ',
    city_en: 'Kafr El Sheikh City',
    address_ar: 'شارع الجيش، كفر الشيخ',
    website_url: 'https://kfs.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-sohag',
    name_ar: 'جامعة سوهاج',
    name_en: 'Sohag University',
    type: 'public',
    governorate_ar: 'سوهاج',
    governorate_en: 'Sohag',
    city_ar: 'سوهاج الجديدة',
    city_en: 'New Sohag',
    address_ar: 'مدينة سوهاج الجديدة، الكوامل',
    website_url: 'https://sohag-univ.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-svu',
    name_ar: 'جامعة جنوب الوادي',
    name_en: 'South Valley University',
    type: 'public',
    governorate_ar: 'قنا',
    governorate_en: 'Qena',
    city_ar: 'قنا',
    city_en: 'Qena City',
    address_ar: 'كيلو 6 طريق قنا سفاجا، قنا',
    website_url: 'https://svu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1995,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-aswan',
    name_ar: 'جامعة أسوان',
    name_en: 'Aswan University',
    type: 'public',
    governorate_ar: 'أسوان',
    governorate_en: 'Aswan',
    city_ar: 'أسوان الجديدة',
    city_en: 'New Aswan',
    address_ar: 'صحاري، السد العالي، أسوان',
    website_url: 'https://aswu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2012,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-psu',
    name_ar: 'جامعة بورسعيد',
    name_en: 'Port Said University',
    type: 'public',
    governorate_ar: 'بورسعيد',
    governorate_en: 'Port Said',
    city_ar: 'بورفؤاد',
    city_en: 'Port Fouad',
    address_ar: 'مدينة بورفؤاد، بورسعيد',
    website_url: 'https://psu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2010,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-azhar',
    name_ar: 'جامعة الأزهر',
    name_en: 'Al-Azhar University',
    type: 'public',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة نصر / الدراسة',
    city_en: 'Nasr City / Darrasa',
    address_ar: 'شارع المخيم الدائم، مدينة نصر، القاهرة',
    website_url: 'https://azhar.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للأزهر وهيئة ضمان الجودة والاعتماد (NAQAAE)',
    accreditation_body_en: 'Supreme Council of Al-Azhar & NAQAAE',
    established_year: 972,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-menoufia',
    name_ar: 'جامعة المنوفية',
    name_en: 'Menoufia University',
    type: 'public',
    governorate_ar: 'المنوفية',
    governorate_en: 'Menoufia',
    city_ar: 'شبين الكوم',
    city_en: 'Shebin El Koum',
    address_ar: 'شبين الكوم، المنوفية',
    website_url: 'https://menofia.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 1976,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-damanhour',
    name_ar: 'جامعة دمنهور',
    name_en: 'Damanhour University',
    type: 'public',
    governorate_ar: 'البحيرة',
    governorate_en: 'Beheira',
    city_ar: 'دمنهور',
    city_en: 'Damanhour',
    address_ar: 'المجمع العلمي، دمنهور، البحيرة',
    website_url: 'https://damanhour.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2010,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-damietta',
    name_ar: 'جامعة دمياط',
    name_en: 'Damietta University',
    type: 'public',
    governorate_ar: 'دمياط',
    governorate_en: 'Damietta',
    city_ar: 'دمياط الجديدة',
    city_en: 'New Damietta',
    address_ar: 'دمياط الجديدة، دمياط',
    website_url: 'https://du.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2012,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-suez',
    name_ar: 'جامعة السويس',
    name_en: 'Suez University',
    type: 'public',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    city_ar: 'السلام / السويس',
    city_en: 'El Salam / Suez',
    address_ar: 'مدينة السلام، السويس',
    website_url: 'https://suez.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2012,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-sadat',
    name_ar: 'جامعة مدينة السادات',
    name_en: 'University of Sadat City',
    type: 'public',
    governorate_ar: 'المنوفية',
    governorate_en: 'Menoufia',
    city_ar: 'مدينة السادات',
    city_en: 'Sadat City',
    address_ar: 'المنطقة السكنية، مدينة السادات، المنوفية',
    website_url: 'https://usc.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2013,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-arish',
    name_ar: 'جامعة العريش',
    name_en: 'Arish University',
    type: 'public',
    governorate_ar: 'شمال سيناء',
    governorate_en: 'North Sinai',
    city_ar: 'العريش',
    city_en: 'Arish',
    address_ar: 'ضاحية السلام، العريش، شمال سيناء',
    website_url: 'https://aru.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2016,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-matrouh',
    name_ar: 'جامعة مطروح',
    name_en: 'Matrouh University',
    type: 'public',
    governorate_ar: 'مطروح',
    governorate_en: 'Matrouh',
    city_ar: 'مرسى مطروح',
    city_en: 'Marsa Matrouh',
    address_ar: 'الكيلو 9، مرسى مطروح',
    website_url: 'https://mau.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2018,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-new-valley',
    name_ar: 'جامعة الوادي الجديد',
    name_en: 'New Valley University',
    type: 'public',
    governorate_ar: 'الوادي الجديد',
    governorate_en: 'New Valley',
    city_ar: 'الخارجة',
    city_en: 'Kharga',
    address_ar: 'الكيلو 10، الخارجة، الوادي الجديد',
    website_url: 'https://nvu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2018,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-luxor',
    name_ar: 'جامعة الأقصر',
    name_en: 'Luxor University',
    type: 'public',
    governorate_ar: 'الأقصر',
    governorate_en: 'Luxor',
    city_ar: 'العوامية / طيبة',
    city_en: 'Awamiya / Thebes',
    address_ar: 'العوامية، الأقصر',
    website_url: 'https://luxor.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Universities (SCU)',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },

  // --------------------------------------------------------------------------
  // B. Private Universities (الجامعات الخاصة المعتمدة)
  // --------------------------------------------------------------------------
  {
    id: 'uni-must',
    name_ar: 'جامعة مصر للعلوم والتكنولوجيا (MUST)',
    name_en: 'Misr University for Science and Technology',
    type: 'private',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: '6 أكتوبر',
    city_en: '6th of October City',
    address_ar: 'المحور المركزي، الحي المتميز، 6 أكتوبر، الجيزة',
    website_url: 'https://must.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية ووزارة التعليم العالي',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 1996,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-o6u',
    name_ar: 'جامعة 6 أكتوبر (O6U)',
    name_en: '6th of October University',
    type: 'private',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: '6 أكتوبر',
    city_en: '6th of October City',
    address_ar: 'المحور المركزي، الحصري، 6 أكتوبر، الجيزة',
    website_url: 'https://o6u.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية ووزارة التعليم العالي',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 1996,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-msa',
    name_ar: 'جامعة أكتوبر للعلوم الحديثة والآداب (MSA)',
    name_en: 'Modern Sciences and Arts University',
    type: 'private',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: '6 أكتوبر',
    city_en: '6th of October City',
    address_ar: 'تقاطع طريق الواحات مع محور 26 يوليو، 6 أكتوبر',
    website_url: 'https://msa.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة (معادلة بالجامعات البريطانية بجرينتش وبدفوردشاير)',
    accreditation_body_en: 'Council of Private Universities (Validated by Greenwich & Bedfordshire)',
    established_year: 1996,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-fue',
    name_ar: 'جامعة المستقبل (FUE)',
    name_en: 'Future University in Egypt',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'القاهرة الجديدة',
    city_en: 'New Cairo',
    address_ar: 'شارع التسعين الجنوبي، التجمع الخامس، القاهرة الجديدة',
    website_url: 'https://fue.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-bue',
    name_ar: 'الجامعة البريطانية في مصر (BUE)',
    name_en: 'The British University in Egypt',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة الشروق',
    city_en: 'El Shorouk City',
    address_ar: 'طريق السويس، مدينة الشروق، القاهرة',
    website_url: 'https://bue.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة (معادلة بالشهادات البريطانية المنظمة من جامعة لندن ساوث بانك)',
    accreditation_body_en: 'Council of Private Universities & London South Bank University',
    established_year: 2005,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-guc',
    name_ar: 'الجامعة الألمانية بالقاهرة (GUC)',
    name_en: 'German University in Cairo',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'القاهرة الجديدة',
    city_en: 'New Cairo',
    address_ar: 'التجمع الخامس، القاهرة الجديدة',
    website_url: 'https://guc.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات واللجنة الألمانية المشتركة (جامعتي أولم وشتوتجارت)',
    accreditation_body_en: 'Supreme Council of Universities & German Partner Universities',
    established_year: 2002,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-buc',
    name_ar: 'جامعة بدر بالقاهرة (BUC)',
    name_en: 'Badr University in Cairo',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة بدر',
    city_en: 'Badr City',
    address_ar: 'طريق القاهرة - السويس، الحي الترفيهي، مدينة بدر',
    website_url: 'https://buc.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2014,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-pua',
    name_ar: 'جامعة فاروس بالإسكندرية (PUA)',
    name_en: 'Pharos University in Alexandria',
    type: 'private',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'سيدي جابر',
    city_en: 'Sidi Gaber',
    address_ar: 'شارع قنال المحمودية، سموحة، الإسكندرية',
    website_url: 'https://pua.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-nub',
    name_ar: 'جامعة النهضة ببني سويف (NUB)',
    name_en: 'Nahda University in Beni Suef',
    type: 'private',
    governorate_ar: 'بني سويف',
    governorate_en: 'Beni Suef',
    city_ar: 'بني سويف الجديدة',
    city_en: 'New Beni Suef',
    address_ar: 'كورنيش النيل الشرقي، بني سويف الجديدة',
    website_url: 'https://nub.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-delta',
    name_ar: 'جامعة الدلتا للعلوم والتكنولوجيا',
    name_en: 'Delta University for Science and Technology',
    type: 'private',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    city_ar: 'جمصة',
    city_en: 'Gamasa',
    address_ar: 'الطريق الدولي الساحلي، جمصة، الدقهلية',
    website_url: 'https://deltauniv.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2007,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-acu',
    name_ar: 'جامعة الأهرام الكندية (ACU)',
    name_en: 'Ahram Canadian University',
    type: 'private',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: '6 أكتوبر',
    city_en: '6th of October City',
    address_ar: 'المنطقة الصناعية، 6 أكتوبر، الجيزة',
    website_url: 'https://acu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية ومؤسسة الأهرام',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2005,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-sinai',
    name_ar: 'جامعة سيناء (Sinai University)',
    name_en: 'Sinai University',
    type: 'private',
    governorate_ar: 'شمال سيناء / الإسماعيلية',
    governorate_en: 'Sinai / Ismailia',
    city_ar: 'العريش / القنطرة شرق',
    city_en: 'Arish / Kantara East',
    address_ar: 'المساعيد، العريش / القنطرة شرق، الإسماعيلية',
    website_url: 'https://su.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-ngu',
    name_ar: 'جامعة الجيزة الجديدة (Newgiza University - NGU)',
    name_en: 'Newgiza University',
    type: 'private',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: 'طريق مصر الإسكندرية الصحراوي',
    city_en: 'New Giza',
    address_ar: 'كيلو 22 طريق القاهرة الإسكندرية الصحراوي، نيو جيزة',
    website_url: 'https://ngu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة (بالشراكة مع UCL وجامعة كينجز لندن)',
    accreditation_body_en: 'Council of Private Universities (In partnership with UCL & King\'s College)',
    established_year: 2016,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-eru',
    name_ar: 'الجامعة المصرية الروسية (ERU)',
    name_en: 'Egyptian Russian University',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة بدر',
    city_en: 'Badr City',
    address_ar: 'المنطقة المركزية، مدينة بدر، القاهرة',
    website_url: 'https://eru.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والشراكة الروسية المعتمدة',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-hue',
    name_ar: 'جامعة حورس (Horus University - HUE)',
    name_en: 'Horus University in Egypt',
    type: 'private',
    governorate_ar: 'دمياط',
    governorate_en: 'Damietta',
    city_ar: 'دمياط الجديدة',
    city_en: 'New Damietta',
    address_ar: 'الطريق الدولي الساحلي، دمياط الجديدة',
    website_url: 'https://hue.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2013,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-mti',
    name_ar: 'الجامعة الحديثة للتكنولوجيا والمعلومات (MTI)',
    name_en: 'Modern University for Technology and Information',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'المقطم / المعادي',
    city_en: 'Mokattam / Maadi',
    address_ar: 'الهضبة الوسطى، المقطم، القاهرة',
    website_url: 'https://mti.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والأهلية ووزارة التعليم العالي',
    accreditation_body_en: 'Council of Private and National Universities',
    established_year: 2004,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-eru',
    name_ar: 'الجامعة المصرية الروسية (ERU)',
    name_en: 'Egyptian Russian University',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة بدر',
    city_en: 'Badr City',
    address_ar: 'المنطقة التعليمية، مدينة بدر، طريق السويس، القاهرة',
    website_url: 'https://eru.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة وهيئة الطاقة الذرية بالتعاون مع روسيا الاتحادية',
    accreditation_body_en: 'Council of Private Universities & Russian Academic Partnership',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-ecu',
    name_ar: 'الجامعة الصينية في مصر (ECU)',
    name_en: 'Egyptian Chinese University',
    type: 'private',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مصر الجديدة / جسر السويس',
    city_en: 'Heliopolis / Gesr El Suez',
    address_ar: 'شارع السلام، جسر السويس، القاهرة',
    website_url: 'https://ecu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الخاصة والتحالف الأكاديمي مع الجامعات الصينية الحكومية',
    accreditation_body_en: 'Council of Private Universities & Chinese Academic Consortium',
    established_year: 2016,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },

  // --------------------------------------------------------------------------
  // C. National (Ahleya) Universities (الجامعات الأهلية المعتمدة)
  // --------------------------------------------------------------------------
  {
    id: 'uni-galala',
    name_ar: 'جامعة الجلالة الأهلية الدولية',
    name_en: 'Galala University',
    type: 'national',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    city_ar: 'هضبة الجلالة',
    city_en: 'Galala Plateau',
    address_ar: 'مدينة الجلالة العالمية، العين السخنة، السويس',
    website_url: 'https://gu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الأهلية والدولية (شهادات مزدوجة مع جامعة أريزونا الأمريكية)',
    accreditation_body_en: 'Council of National Universities & Arizona State University Dual Degrees',
    established_year: 2020,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-alamein',
    name_ar: 'جامعة العلمين الدولية الأهلية',
    name_en: 'Alamein International University',
    type: 'national',
    governorate_ar: 'مطروح',
    governorate_en: 'Matrouh',
    city_ar: 'مدينة العلمين الجديدة',
    city_en: 'New Alamein City',
    address_ar: 'المنطقة السكنية الجامعية، العلمين الجديدة، مطروح',
    website_url: 'https://aiu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الأهلية والدولية ووزارة التعليم العالي',
    accreditation_body_en: 'Council of National and International Universities',
    established_year: 2020,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-salman',
    name_ar: 'جامعة الملك سلمان الدولية الأهلية',
    name_en: 'King Salman International University',
    type: 'national',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    city_ar: 'شرم الشيخ / رأس سدر / الطور',
    city_en: 'Sharm El Sheikh / Ras Sudr / El Tor',
    address_ar: 'فروع شرم الشيخ ورأس سدر والطور، جنوب سيناء',
    website_url: 'https://ksiu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الأهلية والدولية',
    accreditation_body_en: 'Council of National Universities',
    established_year: 2020,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-nmans',
    name_ar: 'جامعة المنصورة الجديدة الأهلية',
    name_en: 'New Mansoura University',
    type: 'national',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    city_ar: 'المنصورة الجديدة',
    city_en: 'New Mansoura City',
    address_ar: 'المنطقة المركزية، مدينة المنصورة الجديدة',
    website_url: 'https://nmu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الأهلية والدولية',
    accreditation_body_en: 'Council of National Universities',
    established_year: 2020,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-cnu',
    name_ar: 'جامعة القاهرة الأهلية',
    name_en: 'Cairo National University',
    type: 'national',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: '6 أكتوبر',
    city_en: '6th of October City',
    address_ar: 'فرع جامعة القاهرة الدولي، 6 أكتوبر، الجيزة',
    website_url: 'https://cnu.cu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة القاهرة الحكومية',
    accreditation_body_en: 'Supreme Council of Universities & Cairo University',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-asnu',
    name_ar: 'جامعة عين شمس الأهلية',
    name_en: 'Ain Shams National University',
    type: 'national',
    governorate_ar: 'القاهرة / القليوبية',
    governorate_en: 'Cairo / Qalyubia',
    city_ar: 'مدينة العبور',
    city_en: 'Obour City',
    address_ar: 'طريق مصر الإسماعيلية، العبور، القاهرة',
    website_url: 'https://asnu.asu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة عين شمس',
    accreditation_body_en: 'Supreme Council of Universities & Ain Shams University',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-alex-nu',
    name_ar: 'جامعة الإسكندرية الأهلية',
    name_en: 'Alexandria National University',
    type: 'national',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'سموحة / أبيس',
    city_en: 'Smouha / Abis',
    address_ar: 'مجمع الكليات بأبيس، الإسكندرية',
    website_url: 'https://anu.alexu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة الإسكندرية',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-mans-nu',
    name_ar: 'جامعة المنصورة الأهلية',
    name_en: 'Mansoura National University',
    type: 'national',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    city_ar: 'جمصة',
    city_en: 'Gamasa',
    address_ar: 'الطريق الدولي الساحلي، جمصة، الدقهلية',
    website_url: 'https://mnu.mans.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة المنصورة',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-bnu',
    name_ar: 'جامعة بنها الأهلية',
    name_en: 'Benha National University',
    type: 'national',
    governorate_ar: 'القليوبية',
    governorate_en: 'Qalyubia',
    city_ar: 'مدينة العبور',
    city_en: 'Obour City',
    address_ar: 'الحي الترفيهي، مدينة العبور، القليوبية',
    website_url: 'https://bnu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة بنها',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-hnu',
    name_ar: 'جامعة حلوان الأهلية',
    name_en: 'Helwan National University',
    type: 'national',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'عين حلوان',
    city_en: 'Ain Helwan',
    address_ar: 'الحرم الجامعي بحلوان، القاهرة',
    website_url: 'https://hnu.helwan.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة حلوان',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-nile',
    name_ar: 'جامعة النيل الأهلية',
    name_en: 'Nile University',
    type: 'national',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: 'الشيخ زايد',
    city_en: 'Sheikh Zayed City',
    address_ar: 'ميدان جهينة، محور 26 يوليو، الشيخ زايد، الجيزة',
    website_url: 'https://nu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'مجلس الجامعات الأهلية ومؤسسة النيل البحثية',
    accreditation_body_en: 'Council of National Universities',
    established_year: 2006,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-ufe',
    name_ar: 'الجامعة الفرنسية في مصر (UFE)',
    name_en: 'French University in Egypt',
    type: 'national',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'مدينة الشروق',
    city_en: 'El Shorouk City',
    address_ar: 'طريق السويس، مدينة الشروق، القاهرة',
    website_url: 'https://ufe.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'اتفاقية حكومية بين جمهورية مصر العربية وجمهورية فرنسا',
    accreditation_body_en: 'Inter-governmental Agreement Egypt-France',
    established_year: 2002,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-assuit-nu',
    name_ar: 'جامعة أسيوط الأهلية',
    name_en: 'Assiut National University',
    type: 'national',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    city_ar: 'أسيوط الجديدة',
    city_en: 'New Assiut',
    address_ar: 'مدينة أسيوط الجديدة، أسيوط',
    website_url: 'https://asnu.aun.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة أسيوط الحكومية',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-zag-nu',
    name_ar: 'جامعة الزقازيق الأهلية',
    name_en: 'Zagazig National University',
    type: 'national',
    governorate_ar: 'الشرقية',
    governorate_en: 'Sharqia',
    city_ar: 'مدينة العاشر من رمضان',
    city_en: '10th of Ramadan City',
    address_ar: 'مدينة العاشر من رمضان، الشرقية',
    website_url: 'https://znu.zu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة الزقازيق',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-menoufia-nu',
    name_ar: 'جامعة المنوفية الأهلية',
    name_en: 'Menoufia National University',
    type: 'national',
    governorate_ar: 'المنوفية',
    governorate_en: 'Menoufia',
    city_ar: 'طوخ طنبشا / بركة السبع',
    city_en: 'Tukh Tanbisha',
    address_ar: 'طريق مصر الإسكندرية الزراعي، المنوفية',
    website_url: 'https://mnu.menofia.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة المنوفية',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-bsu-nu',
    name_ar: 'جامعة بني سويف الأهلية',
    name_en: 'Beni Suef National University',
    type: 'national',
    governorate_ar: 'بني سويف',
    governorate_en: 'Beni Suef',
    city_ar: 'بني سويف الجديدة',
    city_en: 'New Beni Suef',
    address_ar: 'شرق النيل، مجمع الجامعات، بني سويف الجديدة',
    website_url: 'https://bsnu.bsu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة بني سويف',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-svu-nu',
    name_ar: 'جامعة جنوب الوادي الأهلية',
    name_en: 'South Valley National University',
    type: 'national',
    governorate_ar: 'قنا',
    governorate_en: 'Qena',
    city_ar: 'قنا',
    city_en: 'Qena',
    address_ar: 'الحرم الجامعي، قنا',
    website_url: 'https://svnu.svu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وجامعة جنوب الوادي',
    accreditation_body_en: 'Supreme Council of Universities',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },

  // --------------------------------------------------------------------------
  // D. Technological Universities (الجامعات التكنولوجية المعتمدة)
  // --------------------------------------------------------------------------
  {
    id: 'uni-nctu',
    name_ar: 'جامعة القاهرة الجديدة التكنولوجية (NCTU)',
    name_en: 'New Cairo Technological University',
    type: 'technological',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'القاهرة الجديدة',
    city_en: 'New Cairo',
    address_ar: 'منطقة اللوتس، التجمع الخامس، القاهرة الجديدة',
    website_url: 'https://nctu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'صندوق تطوير التعليم والمجلس الأعلى للتعليم التكنولوجي',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-dtu',
    name_ar: 'جامعة الدلتا التكنولوجية',
    name_en: 'Delta Technological University',
    type: 'technological',
    governorate_ar: 'المنوفية',
    governorate_en: 'Menofia',
    city_ar: 'قويسنا',
    city_en: 'Qwesna',
    address_ar: 'المنطقة الصناعية، قويسنا، المنوفية',
    website_url: 'https://dtu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-bstu',
    name_ar: 'جامعة بني سويف التكنولوجية',
    name_en: 'Beni Suef Technological University',
    type: 'technological',
    governorate_ar: 'بني سويف',
    governorate_en: 'Beni Suef',
    city_ar: 'بني سويف الجديدة',
    city_en: 'New Beni Suef',
    address_ar: 'المنطقة الصناعية بياض العرب، بني سويف (الشراكة الكورية كويكا)',
    website_url: 'https://bstu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي ووكالة كويكا الكورية',
    accreditation_body_en: 'Supreme Council of Technological Education & KOICA',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-o6tu',
    name_ar: 'جامعة 6 أكتوبر التكنولوجية',
    name_en: '6th of October Technological University',
    type: 'technological',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: '6 أكتوبر',
    city_en: '6th of October City',
    address_ar: 'المنطقة الصناعية، 6 أكتوبر، الجيزة',
    website_url: 'https://o6tu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-batu',
    name_ar: 'جامعة برج العرب التكنولوجية',
    name_en: 'Borg El Arab Technological University',
    type: 'technological',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'برج العرب الجديدة',
    city_en: 'New Borg El Arab',
    address_ar: 'الجامعات، برج العرب الجديدة، الإسكندرية',
    website_url: 'https://batu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-miu-tech',
    name_ar: 'جامعة مصر التكنولوجية الدولية',
    name_en: 'Misr International Technological University',
    type: 'technological',
    governorate_ar: 'القاهرة / العاشر من رمضان',
    governorate_en: 'Cairo / 10th of Ramadan',
    city_ar: 'الأميرية / العاشر',
    city_en: 'Amiriya / 10th of Ramadan',
    address_ar: 'مجمع التكنولوجيا المتطور، الأميرية، القاهرة',
    website_url: 'https://mitu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'صندوق تطوير التعليم والمجلس الأعلى للتعليم التكنولوجي (شراكة إيطالية تيك سبيكس)',
    accreditation_body_en: 'Supreme Council of Technological Education & Italian Partnership',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-assuit-tech',
    name_ar: 'جامعة أسيوط الجديدة التكنولوجية',
    name_en: 'New Assiut Technological University',
    type: 'technological',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    city_ar: 'أسيوط الجديدة',
    city_en: 'New Assiut',
    address_ar: 'مدينة أسيوط الجديدة، أسيوط',
    website_url: 'https://natu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي ووزارة التعليم العالي',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-samanoud-tech',
    name_ar: 'جامعة سمنود التكنولوجية',
    name_en: 'Samanoud Technological University',
    type: 'technological',
    governorate_ar: 'الغربية',
    governorate_en: 'Gharbia',
    city_ar: 'سمنود',
    city_en: 'Samanoud',
    address_ar: 'سمنود، محافظة الغربية',
    website_url: 'https://sntu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي (تكنولوجيا الغزل والنسيج وصناعة الملابس)',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-thebes-tech',
    name_ar: 'جامعة طيبة التكنولوجية',
    name_en: 'Thebes Technological University',
    type: 'technological',
    governorate_ar: 'الأقصر',
    governorate_en: 'Luxor',
    city_ar: 'طيبة الجديدة',
    city_en: 'New Thebes',
    address_ar: 'مدينة طيبة الجديدة، الأقصر',
    website_url: 'https://ttu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي (تكنولوجيا السياحة والفندقة والخدمات)',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-east-port-tech',
    name_ar: 'جامعة شرق بورسعيد التكنولوجية',
    name_en: 'East Port Said Technological University',
    type: 'technological',
    governorate_ar: 'بورسعيد',
    governorate_en: 'Port Said',
    city_ar: 'مدينة سلام مصر (شرق بورسعيد)',
    city_en: 'Salam City (East Port Said)',
    address_ar: 'مدينة سلام مصر، شرق بورسعيد',
    website_url: 'https://epstu.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للتعليم التكنولوجي (تكنولوجيا النقل واللوجستيات والموانئ)',
    accreditation_body_en: 'Supreme Council of Technological Education',
    established_year: 2022,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },

  // --------------------------------------------------------------------------
  // E. International Branch Campuses (فروع الجامعات الدولية المعتمدة بالعاصمة الإدارية)
  // --------------------------------------------------------------------------
  {
    id: 'uni-uofcanada',
    name_ar: 'مؤسسة الجامعات الكندية في مصر (UofCanada)',
    name_en: 'Universities of Canada in Egypt',
    type: 'international_branch',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العاصمة الإدارية الجديدة',
    city_en: 'New Administrative Capital',
    address_ar: 'مجمع فروع الجامعات الدولية، العاصمة الإدارية الجديدة',
    website_url: 'https://uofcanada.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'قانون فروع الجامعات الأجنبية رقم 162 لسنة 2018 (فرع جامعة جزيرة الأمير إدوارد UPEI وجامعة رايرسون/تورنتو ميتروبوليتان TMU)',
    accreditation_body_en: 'International Branch Campuses Law 162/2018 (UPEI & TMU Canada)',
    established_year: 2018,
    last_reviewed_at: '2026-11-01',
    is_active: true,
    partnership_nature_ar: 'فرع معتمد رسمي لمنح درجات علمية كندية مباشرة',
    foreign_partner_name_en: 'University of Prince Edward Island & Toronto Metropolitan University'
  },
  {
    id: 'uni-eue',
    name_ar: 'مؤسسة الجامعات الأوروبية في مصر (EUE)',
    name_en: 'European Universities in Egypt',
    type: 'international_branch',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العاصمة الإدارية الجديدة',
    city_en: 'New Administrative Capital',
    address_ar: 'منطقة الجامعات الدولية R7، العاصمة الإدارية الجديدة',
    website_url: 'https://eue.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'قانون فروع الجامعات الأجنبية (مستضيفة لجامعة لندن برئاسة LSE وجامعة سنترال لانكشاير UCLan)',
    accreditation_body_en: 'International Branch Law (Hosting University of London & UCLan)',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true,
    partnership_nature_ar: 'فرع كامل يمنح درجات جامعة لندن البريطانية',
    foreign_partner_name_en: 'University of London & University of Central Lancashire'
  },
  {
    id: 'uni-tkh',
    name_ar: 'مؤسسة جامعات المعرفة الدولية (The Knowledge Hub - TKH)',
    name_en: 'The Knowledge Hub Universities',
    type: 'international_branch',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العاصمة الإدارية الجديدة',
    city_en: 'New Administrative Capital',
    address_ar: 'محور بن زايد، العاصمة الإدارية الجديدة',
    website_url: 'https://tkh.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'فرع جامعة كوفنتري البريطانية Coventry University وجامعة نوفا دي لشبونة البرتغالية Nova University Lisbon',
    accreditation_body_en: 'Coventry University UK & NOVA University Lisbon Portugal Branch',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true,
    partnership_nature_ar: 'فرع جامعة كوفنتري البريطانية المعتمد بمصر',
    foreign_partner_name_en: 'Coventry University UK & Nova University Lisbon'
  },
  {
    id: 'uni-giu',
    name_ar: 'الجامعة الألمانية الدولية بالعاصمة الإدارية (GIU)',
    name_en: 'German International University',
    type: 'international_branch',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العاصمة الإدارية الجديدة',
    city_en: 'New Administrative Capital',
    address_ar: 'الحي الدبلوماسي، العاصمة الإدارية الجديدة',
    website_url: 'https://giu-uni.de',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'اتفاقية التحالف الجامعي للعلوم التطبيقية الألماني (HTW Berlin, Ulm, Heilbronn, HFT Stuttgart)',
    accreditation_body_en: 'Consortium of German Universities of Applied Sciences',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true,
    partnership_nature_ar: 'جامعة ألمانية تطبيقية تمنح البكالوريوس المعتمد أوروبياً',
    foreign_partner_name_en: 'German Universities Consortium'
  },
  {
    id: 'uni-gaf',
    name_ar: 'مؤسسة جلوبال الأكاديمية (جامعة هيرتفوردشاير البريطانية)',
    name_en: 'Global Academic Foundation - University of Hertfordshire',
    type: 'international_branch',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العاصمة الإدارية الجديدة',
    city_en: 'New Administrative Capital',
    address_ar: 'القطاع الدبلوماسي، العاصمة الإدارية الجديدة',
    website_url: 'https://gaf.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'فرع رسمي لجامعة هيرتفوردشاير البريطانية بموجب القرار الجمهوري رقم 561 لسنة 2019',
    accreditation_body_en: 'University of Hertfordshire UK Egyptian Branch',
    established_year: 2019,
    last_reviewed_at: '2026-11-01',
    is_active: true,
    partnership_nature_ar: 'فرع كامل يمنح درجات جامعة هيرتفوردشاير البريطانية',
    foreign_partner_name_en: 'University of Hertfordshire UK'
  },
  {
    id: 'uni-ulondon',
    name_ar: 'مؤسسة جامعات لندن بجمهورية مصر العربية',
    name_en: 'University of London International Branch Foundation',
    type: 'international_branch',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'العاصمة الإدارية الجديدة',
    city_en: 'New Administrative Capital',
    address_ar: 'منطقة الجامعات، العاصمة الإدارية الجديدة',
    website_url: 'https://london.ac.uk',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'قانون فروع الجامعات الأجنبية رقم 162 لسنة 2018',
    accreditation_body_en: 'International Branch Campuses Law 162/2018',
    established_year: 2021,
    last_reviewed_at: '2026-11-01',
    is_active: true,
    partnership_nature_ar: 'فرع معتمد رسمياً لمنح درجات جامعة لندن بالمملكة المتحدة',
    foreign_partner_name_en: 'University of London Federation'
  },

  // --------------------------------------------------------------------------
  // F. Institutions with Special Nature (مؤسسات جامعية ذات طبيعة خاصة واتفاقيات)
  // --------------------------------------------------------------------------
  {
    id: 'uni-auc',
    name_ar: 'الجامعة الأمريكية بالقاهرة (AUC)',
    name_en: 'The American University in Cairo',
    type: 'special_nature',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    city_ar: 'القاهرة الجديدة',
    city_en: 'New Cairo',
    address_ar: 'ميدان التحرير / شارع التسعين الجنوبي، التجمع الخامس',
    website_url: 'https://aucegypt.edu',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'المجلس الأعلى للجامعات وهيئة الاعتماد الأمريكية MSCHE',
    accreditation_body_en: 'Middle States Commission on Higher Education (MSCHE) & SCU',
    established_year: 1919,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-ejust',
    name_ar: 'الجامعة المصرية اليابانية للعلوم والتكنولوجيا (E-JUST)',
    name_en: 'Egypt-Japan University of Science and Technology',
    type: 'special_nature',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    city_ar: 'برج العرب الجديدة',
    city_en: 'New Borg El Arab',
    address_ar: 'منطقة الجامعات، مدينة برج العرب الجديدة، الإسكندرية',
    website_url: 'https://ejust.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'اتفاقية ثنائية بين الحكومتين المصرية واليابانية (هيئة جايكا JICA)',
    accreditation_body_en: 'Bilateral Agreement Egypt-Japan & JICA Cooperation',
    established_year: 2010,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-zewail',
    name_ar: 'مدينة زويل للعلوم والتكنولوجيا (جامعة زويل)',
    name_en: 'Zewail City of Science and Technology',
    type: 'special_nature',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    city_ar: 'حدائق أكتوبر',
    city_en: 'October Gardens',
    address_ar: 'طريق أحمد زويل، حدائق أكتوبر، الجيزة',
    website_url: 'https://zewailcity.edu.eg',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'قانون خاص صادر بقرار جمهوري وهيئة الاعتماد ABET الدولية',
    accreditation_body_en: 'Special Public Entity Law & ABET International Accreditation',
    established_year: 2011,
    last_reviewed_at: '2026-11-01',
    is_active: true
  },
  {
    id: 'uni-aastmt',
    name_ar: 'الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري (AASTMT)',
    name_en: 'Arab Academy for Science, Technology and Maritime Transport',
    type: 'special_nature',
    governorate_ar: 'الإسكندرية / القاهرة',
    governorate_en: 'Alexandria / Cairo',
    city_ar: 'أبي قير / مصر الجديدة والقرية الذكية',
    city_en: 'Abu Qir / Sheraton & Smart Village',
    address_ar: 'مجمع ميامي وأبي قير، الإسكندرية / مساكن شيراتون، القاهرة',
    website_url: 'https://aast.edu',
    accreditation_status: 'accredited',
    accreditation_body_ar: 'جامعة الدول العربية والمجلس الأعلى للجامعات المصرية وهيئات RIBA و ABET',
    accreditation_body_en: 'League of Arab States & SCU Egypt (ABET & RIBA accredited)',
    established_year: 1972,
    last_reviewed_at: '2026-11-01',
    is_active: true
  }
];

// ============================================================================
// COMPREHENSIVE ACCREDITED FACULTIES & SPECIALIZATIONS DATABASE
// Mapped by University -> Faculty -> Academic Specializations / Programs
// Aggregated across verified catalogs: Al-Azhar, Public, Private, National, Tech
// ============================================================================

export const INITIAL_FACULTIES: UniversityFaculty[] = getAllAccreditedFaculties();


/**
 * Fast lookup helper for faculties of a given university
 */
export function getFacultiesByUniversity(
  faculties: UniversityFaculty[],
  universityId: string
): UniversityFaculty[] {
  if (!universityId) return [];
  const list = faculties.filter(f => f.university_id === universityId && f.is_active !== false);
  if (list.length > 0) return list;

  // Dynamic fallback for any additional or custom accredited university
  return [
    {
      id: `fac-auto-eng-${universityId}`,
      university_id: universityId,
      name_ar: 'كلية الهندسة والعلوم التطبيقية',
      name_en: 'Faculty of Engineering & Applied Sciences',
      sector: 'engineering',
      sector_ar: 'القطاع الهندسي والتكنولوجي',
      accreditation_status: 'accredited',
      is_active: true,
      specializations: [
        { id: `sp-auto-eng-1-${universityId}`, faculty_id: `fac-auto-eng-${universityId}`, name_ar: 'الهندسة المدنية والإنشاءات', name_en: 'Civil & Construction Engineering', degree_ar: 'بكالوريوس هندسة معتمد', degree_en: 'B.Sc. in Civil Engineering', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true },
        { id: `sp-auto-eng-2-${universityId}`, faculty_id: `fac-auto-eng-${universityId}`, name_ar: 'الهندسة الكهربائية وهندسة الاتصالات', name_en: 'Electrical & Communications Engineering', degree_ar: 'بكالوريوس هندسة معتمد', degree_en: 'B.Sc. in Electrical Engineering', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
      ]
    },
    {
      id: `fac-auto-cs-${universityId}`,
      university_id: universityId,
      name_ar: 'كلية الحاسبات والذكاء الاصطناعي',
      name_en: 'Faculty of Computers & Artificial Intelligence',
      sector: 'science',
      sector_ar: 'قطاع علوم الحاسب والمعلوماتية',
      accreditation_status: 'accredited',
      is_active: true,
      specializations: [
        { id: `sp-auto-cs-1-${universityId}`, faculty_id: `fac-auto-cs-${universityId}`, name_ar: 'علوم الحاسب والذكاء الاصطناعي', name_en: 'Computer Science & AI', degree_ar: 'بكالوريوس حاسبات ومعلومات', degree_en: 'B.Sc. in CS & AI', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true },
        { id: `sp-auto-cs-2-${universityId}`, faculty_id: `fac-auto-cs-${universityId}`, name_ar: 'نظم المعلومات والأمن السيبراني', name_en: 'Information Systems & Cybersecurity', degree_ar: 'بكالوريوس نظم معلومات', degree_en: 'B.Sc. in IS & Cybersecurity', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
      ]
    },
    {
      id: `fac-auto-biz-${universityId}`,
      university_id: universityId,
      name_ar: 'كلية العلوم الإدارية وإدارة الأعمال',
      name_en: 'Faculty of Business Administration',
      sector: 'business',
      sector_ar: 'قطاع الإدارة والاقتصاد',
      accreditation_status: 'accredited',
      is_active: true,
      specializations: [
        { id: `sp-auto-biz-1-${universityId}`, faculty_id: `fac-auto-biz-${universityId}`, name_ar: 'إدارة الأعمال والمحاسبة', name_en: 'Business Administration & Accounting', degree_ar: 'بكالوريوس تجارة وإدارة أعمال', degree_en: 'B.Sc. in Business', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true },
        { id: `sp-auto-biz-2-${universityId}`, faculty_id: `fac-auto-biz-${universityId}`, name_ar: 'التمويل والاستثمار والتسويق الرقمي', name_en: 'Finance, Investment & Digital Marketing', degree_ar: 'بكالوريوس إدارة مالية', degree_en: 'B.Sc. in Finance & Marketing', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
      ]
    }
  ];
}

/**
 * Fast lookup helper for specializations of a given faculty
 */
export function getSpecializationsByFaculty(
  faculties: UniversityFaculty[],
  facultyId: string
): AcademicSpecialization[] {
  if (!facultyId) return [];
  const fac = faculties.find(f => f.id === facultyId);
  if (!fac) return [];
  if (fac.specializations && fac.specializations.length > 0) {
    return fac.specializations.filter(s => s.is_available !== false);
  }
  // Fallback single specialization object if specializations array is not populated
  return [
    {
      id: `sp-fallback-${fac.id}`,
      faculty_id: fac.id,
      name_ar: fac.specialization_ar || fac.name_ar,
      name_en: fac.specialization_en || fac.name_en,
      degree_ar: 'بكالوريوس / ليسانس',
      degree_en: 'Bachelor',
      program_type: 'general',
      program_type_ar: 'برنامج معتمد',
      study_system_ar: 'نظام معتمد',
      is_available: true
    }
  ];
}


/**
 * Fast lookup helper for campuses of a given university
 */
export function getCampusesByUniversity(
  campuses: UniversityCampus[],
  universityId: string
): UniversityCampus[] {
  if (!universityId) return [];
  return campuses.filter(c => c.university_id === universityId && c.is_active !== false);
}

/**
 * Filter and search faculties by query, campus, and gender
 */
export function searchFaculties(
  faculties: UniversityFaculty[],
  query: string = '',
  campusId?: string,
  genderType?: string
): UniversityFaculty[] {
  const normQuery = normalizeAcademicSearch(query);
  return faculties.filter(f => {
    if (f.is_active === false) return false;
    if (campusId && campusId !== 'all' && f.campus_id && f.campus_id !== campusId) return false;
    if (genderType && genderType !== 'all') {
      if (genderType === 'male' && f.gender_type && f.gender_type !== 'male' && f.gender_type !== 'coeducational' && f.gender_type !== 'all') return false;
      if (genderType === 'female' && f.gender_type && f.gender_type !== 'female' && f.gender_type !== 'coeducational' && f.gender_type !== 'all') return false;
    }
    if (!normQuery) return true;
    const nameAr = normalizeAcademicSearch(f.name_ar);
    const nameEn = normalizeAcademicSearch(f.name_en);
    const campusAr = normalizeAcademicSearch(f.campus_name_ar);
    const govAr = normalizeAcademicSearch(f.governorate_ar);
    const specAr = normalizeAcademicSearch(f.specialization_ar);
    return nameAr.includes(normQuery) ||
      nameEn.includes(normQuery) ||
      campusAr.includes(normQuery) ||
      govAr.includes(normQuery) ||
      specAr.includes(normQuery);
  });
}

/**
 * Filter and search specializations by query
 */
export function searchSpecializations(
  specializations: AcademicSpecialization[],
  query: string = ''
): AcademicSpecialization[] {
  if (!query) return specializations;
  const normQuery = normalizeAcademicSearch(query);
  return specializations.filter(s => {
    if (s.is_available === false) return false;
    const nameAr = normalizeAcademicSearch(s.name_ar);
    const nameEn = normalizeAcademicSearch(s.name_en);
    const degAr = normalizeAcademicSearch(s.degree_ar);
    const degEn = normalizeAcademicSearch(s.degree_en);
    const typeAr = normalizeAcademicSearch(s.program_type_ar);
    return nameAr.includes(normQuery) ||
      nameEn.includes(normQuery) ||
      degAr.includes(normQuery) ||
      degEn.includes(normQuery) ||
      typeAr.includes(normQuery);
  });
}
