import { UniversityFaculty } from '../../types/database.types';

/**
 * COMPREHENSIVE ACCREDITED EGYPTIAN NATIONAL UNIVERSITIES FACULTIES
 * Source: Council of National Universities & Ministry of Higher Education Egypt
 */
export const NATIONAL_FACULTIES: UniversityFaculty[] = [
  // --------------------------------------------------------------------------
  // 1. GALALA NATIONAL UNIVERSITY (جامعة الجلالة الأهلية الدولية)
  // --------------------------------------------------------------------------
  {
    id: 'fac-galala-med',
    university_id: 'uni-galala',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    name_ar: 'مجال الطب البشري بالجلالة',
    name_en: 'Field of Medicine (Galala University)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'General Medicine & Surgery (MBBCh)',
    source_verification: 'Ministry of Higher Education & ASU Dual Program',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-galala-mbbch', faculty_id: 'fac-galala-med', name_ar: 'برنامج بكالوريوس الطب والجراحة العامة التكاملي (5+2)', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج أهلي معتمد', study_system_ar: 'ساعات معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-galala-dent',
    university_id: 'uni-galala',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    name_ar: 'مجال طب الأسنان',
    name_en: 'Field of Dental Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان (BDS)',
    specialization_en: 'Dental Surgery',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-galala-dent', faculty_id: 'fac-galala-dent', name_ar: 'برنامج طب وجراحة الأسنان المعتمد', name_en: 'BDS Dental Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج أهلي معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-galala-eng',
    university_id: 'uni-galala',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    name_ar: 'مجال العلوم الهندسية والتصميم (شهادة مزدوجة مع أريزونا ستايت ASU)',
    name_en: 'Field of Engineering (Dual Degree with Arizona State University)',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة الذكاء الاصطناعي والميكاترونكس والعمارة البيئية مع شهادة جامعة ولاية أريزونا الأمريكية',
    specialization_en: 'AI, Mechatronics & Architectural Dual Degree with ASU USA',
    source_verification: 'Arizona State University (USA) & MoHESR Egypt',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-galala-eng-asu', faculty_id: 'fac-galala-eng', name_ar: 'برنامج هندسة البرمجيات والذكاء الاصطناعي (مزدوج مع أريزونا)', name_en: 'Software Engineering Dual with ASU USA', degree_ar: 'بكالوريوس', degree_en: 'B.Sc (Dual US/EG)', program_type: 'joint_international', program_type_ar: 'شهادة أمريكية مزدوجة معتمدة', study_system_ar: 'ساعات معتمدة أمريكية ABET', is_available: true }
    ]
  },
  {
    id: 'fac-galala-pharm',
    university_id: 'uni-galala',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    name_ar: 'مجال العلوم الصيدلية',
    name_en: 'Field of Pharmaceutical Sciences',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصيدلي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي الصيدلة الإكلينيكية (PharmD Clinical)',
    specialization_en: 'Doctor of Pharmacy (PharmD Clinical)',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-galala-pharmd', faculty_id: 'fac-galala-pharm', name_ar: 'برنامج دكتور صيدلي الصيدلة الإكلينيكية (PharmD)', name_en: 'PharmD Clinical Pharmacy', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج أهلي معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. KING SALMAN INTERNATIONAL UNIVERSITY (جامعة الملك سلمان الدولية - 3 أفرع)
  // --------------------------------------------------------------------------
  {
    id: 'fac-salman-med-tor',
    university_id: 'uni-salman',
    campus_id: 'camp-ksiu-tor',
    campus_name_ar: 'فرع مدينة الطور',
    campus_name_en: 'Tor Sinai Campus',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    name_ar: 'مجال الطب البشري (فرع الطور)',
    name_en: 'Field of Medicine (Tor Sinai Campus)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'Integrated MBBCh Medicine',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-salman-mbbch', faculty_id: 'fac-salman-med-tor', name_ar: 'برنامج بكالوريوس الطب والجراحة التكاملي', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج أهلي معتمد', study_system_ar: 'ساعات معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-salman-tourism-sharm',
    university_id: 'uni-salman',
    campus_id: 'camp-ksiu-sharm',
    campus_name_ar: 'فرع شرم الشيخ الدولي',
    campus_name_en: 'Sharm El-Sheikh Campus',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    name_ar: 'مجال السياحة والضيافة الدولية (فرع شرم الشيخ)',
    name_en: 'Field of Tourism & Hospitality (Sharm El-Sheikh Campus)',
    sector: 'business',
    sector_ar: 'قطاع السياحة والفندقة الدولية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'إدارة الفنادق والمنتجعات السياحية الدولية وإدارة الفعاليات',
    specialization_en: 'International Hotel & Resort Management',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-salman-tourism-hotel', faculty_id: 'fac-salman-tourism-sharm', name_ar: 'برنامج إدارة الفنادق والمنتجعات السياحية', name_en: 'Hotel & Resort Management', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج دولي متميز', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-salman-agri-sudr',
    university_id: 'uni-salman',
    campus_id: 'camp-ksiu-sudr',
    campus_name_ar: 'فرع رأس سدر',
    campus_name_en: 'Ras Sudr Campus',
    governorate_ar: 'جنوب سيناء',
    governorate_en: 'South Sinai',
    name_ar: 'مجال الزراعات الصحراوية والتكنولوجيا البيئية (فرع رأس سدر)',
    name_en: 'Field of Desert Agriculture (Ras Sudr Campus)',
    sector: 'humanities',
    sector_ar: 'القطاع الزراعي والبيئي الصحراوي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الإنتاج النباتي في المناطق الجافة وتكنولوجيا تحلية المياه واستصلاح الصحراء',
    specialization_en: 'Arid Land Crop Production & Desert Reclamation',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-salman-agri-desert', faculty_id: 'fac-salman-agri-sudr', name_ar: 'برنامج الزراعات الصحراوية وتكنولوجيا المياه', name_en: 'Desert Agriculture & Water Tech', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي تخصصي', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. ALAMEIN INTERNATIONAL UNIVERSITY (جامعة العلمين الدولية الأهلية)
  // --------------------------------------------------------------------------
  {
    id: 'fac-alamein-pharm',
    university_id: 'uni-alamein',
    governorate_ar: 'مطروح',
    governorate_en: 'Matrouh',
    name_ar: 'مجال العلوم الصيدلية (شهادة مزدوجة مع لويفيل الأمريكية Louisville)',
    name_en: 'Field of Pharmacy (Dual Degree with University of Louisville USA)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصيدلي الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي الصيدلة الإكلينيكية بالشهادة المزدوجة مع جامعة لويفيل بالولايات المتحدة',
    specialization_en: 'PharmD Clinical Pharmacy with University of Louisville Dual Degree',
    source_verification: 'University of Louisville (USA) & MoHESR',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-alamein-pharm-louis', faculty_id: 'fac-alamein-pharm', name_ar: 'برنامج دكتور صيدلي بالشهادة المزدوجة (جامعة لويفيل الأمريكية)', name_en: 'PharmD Dual Degree Program (Univ of Louisville)', degree_ar: 'بكالوريوس', degree_en: 'PharmD (Dual US/EG)', program_type: 'joint_international', program_type_ar: 'شهادة أمريكية مزدوجة معتمدة', study_system_ar: 'ساعات معتمدة دولية', is_available: true }
    ]
  },
  {
    id: 'fac-alamein-cs',
    university_id: 'uni-alamein',
    governorate_ar: 'مطروح',
    governorate_en: 'Matrouh',
    name_ar: 'مجال علوم وهندسة الحاسبات',
    name_en: 'Field of Computer Science & Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي والحاسبات الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الذكاء الاصطناعي وعلوم البيانات وهندسة البرمجيات بالشهادة المزدوجة مع جامعة لويفيل',
    specialization_en: 'AI, Data Science & Software Engineering (Louisville Dual)',
    source_verification: 'University of Louisville (USA) & MoHESR',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-alamein-cs-ai', faculty_id: 'fac-alamein-cs', name_ar: 'برنامج الذكاء الاصطناعي وعلوم البيانات (شراكة أمريكية)', name_en: 'Artificial Intelligence & Data Science Program', degree_ar: 'بكالوريوس', degree_en: 'B.Sc (Dual US/EG)', program_type: 'joint_international', program_type_ar: 'برنامج أهلي دولي مشترك', study_system_ar: 'ساعات معتمدة أمريكية', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 4. NEW MANSOURA UNIVERSITY (جامعة المنصورة الجديدة الأهلية)
  // --------------------------------------------------------------------------
  {
    id: 'fac-nmans-med',
    university_id: 'uni-nmans',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'Integrated MBBCh Medicine',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-nmans-mbbch', faculty_id: 'fac-nmans-med', name_ar: 'بكالوريوس الطب والجراحة العامة (النظام التكاملي)', name_en: 'Integrated MBBCh Medicine', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج أهلي معتمد', study_system_ar: 'ساعات معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-nmans-dent',
    university_id: 'uni-nmans',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    name_ar: 'كلية طب الأسنان',
    name_en: 'Faculty of Dentistry',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان (BDS)',
    specialization_en: 'Dental Surgery',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-nmans-dent', faculty_id: 'fac-nmans-dent', name_ar: 'برنامج طب وجراحة الأسنان', name_en: 'BDS Dental Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج أهلي معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  }
];
