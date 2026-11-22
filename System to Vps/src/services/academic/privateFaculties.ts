import { UniversityFaculty } from '../../types/database.types';

/**
 * COMPREHENSIVE ACCREDITED EGYPTIAN PRIVATE UNIVERSITIES FACULTIES
 * Source: Council of Private Universities (CPU) & NAQAAE Egypt
 */
export const PRIVATE_FACULTIES: UniversityFaculty[] = [
  // --------------------------------------------------------------------------
  // 1. MISR UNIVERSITY FOR SCIENCE & TECHNOLOGY (MUST - جامعة مصر للعلوم والتكنولوجيا)
  // --------------------------------------------------------------------------
  {
    id: 'fac-must-med',
    university_id: 'uni-must',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الطب البشري بمستشفى سعاد كفافي الجامعي',
    name_en: 'Faculty of Medicine (Souad Kafafi University Hospital)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'General Medicine & Surgery (MBBCh)',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-must-mbbch', faculty_id: 'fac-must-med', name_ar: 'بكالوريوس الطب والجراحة العامة التكاملي (5+2)', name_en: 'Integrated MBBCh Medicine', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج خاص معتمد', study_system_ar: 'ساعات معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-must-dent',
    university_id: 'uni-must',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية جراحة الفم والأسنان',
    name_en: 'Faculty of Oral & Dental Surgery',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان (BDS)',
    specialization_en: 'Bachelor of Dental Surgery',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-must-dent', faculty_id: 'fac-must-dent', name_ar: 'برنامج طب وجراحة الفم والأسنان (BDS)', name_en: 'Dental Surgery Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-must-pharm',
    university_id: 'uni-must',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الصيدلة والتصنيع الدوائي',
    name_en: 'Faculty of Pharmacy & Pharmaceutical Industries',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصيدلي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي (PharmD) والصيدلة الإكلينيكية',
    specialization_en: 'PharmD & Clinical Pharmacy',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-must-pharmd', faculty_id: 'fac-must-pharm', name_ar: 'برنامج دكتور صيدلي (PharmD)', name_en: 'Doctor of Pharmacy Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true },
      { id: 'sp-must-pharmd-clin', faculty_id: 'fac-must-pharm', name_ar: 'برنامج الصيدلة الإكلينيكية (PharmD Clinical)', name_en: 'Clinical Pharmacy Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },
  {
    id: 'fac-must-pt',
    university_id: 'uni-must',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية العلاج الطبيعي',
    name_en: 'Faculty of Physical Therapy',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والتأهيلي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'العلاج الطبيعي والتأهيل الحركي (DPT)',
    specialization_en: 'Doctor of Physical Therapy (DPT)',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-must-dpt', faculty_id: 'fac-must-pt', name_ar: 'برنامج دكتور العلاج الطبيعي المهني (DPT)', name_en: 'DPT Physical Therapy', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },
  {
    id: 'fac-must-biotech',
    university_id: 'uni-must',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية التكنولوجيا الحيوية (Biotechnology)',
    name_en: 'Faculty of Biotechnology',
    sector: 'medical',
    sector_ar: 'قطاع العلوم الحيوية والطبية التطبيقية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'التكنولوجيا الحيوية الطبية والزراعية والبيئية والمناعية',
    specialization_en: 'Medical, Agricultural & Environmental Biotechnology',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-must-biotech-med', faculty_id: 'fac-must-biotech', name_ar: 'برنامج التكنولوجيا الحيوية الطبية والتشخيصية', name_en: 'Medical Biotechnology Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج خاص معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-must-eng',
    university_id: 'uni-must',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة الطبية الحيوية والمعمارية والمدنية والميكاترونكس وهندسة الحاسبات',
    specialization_en: 'Biomedical, Mechatronics, Architectural & Computer Engineering',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-must-eng-biomed', faculty_id: 'fac-must-eng', name_ar: 'هندسة الأجهزة الطبية والطب الحيوي', name_en: 'Biomedical Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج تخصصي متميز', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. BADR UNIVERSITY IN CAIRO (BUC - جامعة بدر بالقاهرة)
  // --------------------------------------------------------------------------
  {
    id: 'fac-buc-med',
    university_id: 'uni-buc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الطب البشري',
    name_en: 'School of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'Integrated MBBCh Medicine',
    source_verification: 'Council of Private Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-buc-mbbch', faculty_id: 'fac-buc-med', name_ar: 'بكالوريوس الطب والجراحة العامة (5+2)', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-buc-dent',
    university_id: 'uni-buc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية طب الفم والأسنان',
    name_en: 'School of Dental Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان (BDS)',
    specialization_en: 'Oral & Dental Surgery',
    source_verification: 'Council of Private Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-buc-dent', faculty_id: 'fac-buc-dent', name_ar: 'برنامج طب وجراحة الفم والأسنان', name_en: 'Dental Surgery Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-buc-eng',
    university_id: 'uni-buc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الهندسة والتكنولوجيا',
    name_en: 'School of Engineering & Technology',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المعمارية والمدنية والميكانيكية وأنظمة الطاقة المتجددة',
    specialization_en: 'Renewable Energy, Architectural & Civil Engineering',
    source_verification: 'Council of Private Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-buc-eng-renew', faculty_id: 'fac-buc-eng', name_ar: 'هندسة الطاقة والطاقات المتجددة', name_en: 'Renewable Energy Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. BRITISH UNIVERSITY IN EGYPT (BUE - الجامعة البريطانية في مصر)
  // --------------------------------------------------------------------------
  {
    id: 'fac-bue-eng',
    university_id: 'uni-bue',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الهندسة والشهادة المزدوجة (لندن ساوث بانك)',
    name_en: 'Faculty of Engineering (Dual UK Degree - LSBU)',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المعمارية والمدنية والميكانيكية والبترول والكيميائية مع شهادة بريطانية',
    specialization_en: 'Civil, Architecture, Chemical & Petroleum Dual Degrees',
    source_verification: 'QAA UK & NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-bue-eng-dual', faculty_id: 'fac-bue-eng', name_ar: 'برنامج الهندسة المدنية بالشهادة المزدوجة البريطانية (B.Eng)', name_en: 'Civil Engineering (Dual British BEng/BSc)', degree_ar: 'بكالوريوس', degree_en: 'B.Eng / B.Sc', program_type: 'joint_international', program_type_ar: 'شهادة بريطانية مزدوجة معتمدة', study_system_ar: 'نظام الساعات المعتمدة البريطاني', is_available: true }
    ]
  },
  {
    id: 'fac-bue-dent',
    university_id: 'uni-bue',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية طب الأسنان',
    name_en: 'Faculty of Dentistry',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان (BDS)',
    specialization_en: 'Dental Surgery',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-bue-dent', faculty_id: 'fac-bue-dent', name_ar: 'برنامج طب وجراحة الأسنان', name_en: 'BDS Dental Surgery', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-bue-pharm',
    university_id: 'uni-bue',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الصيدلة',
    name_en: 'Faculty of Pharmacy',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي (PharmD)',
    specialization_en: 'Doctor of Pharmacy',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-bue-pharmd', faculty_id: 'fac-bue-pharm', name_ar: 'برنامج دكتور صيدلي الصيدلة الإكلينيكية (PharmD)', name_en: 'PharmD Clinical Pharmacy', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 4. GERMAN UNIVERSITY IN CAIRO (GUC - الجامعة الألمانية بالقاهرة)
  // --------------------------------------------------------------------------
  {
    id: 'fac-guc-eng',
    university_id: 'uni-guc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية هندسة وتكنولوجيا الإعلام والمعلومات',
    name_en: 'Faculty of Information Engineering & Technology',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي الألماني',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة الشبكات والاتصالات وهندسة البرمجيات مع اعتماد ACQUIN الألماني',
    specialization_en: 'Networking, Communications & Software Engineering',
    source_verification: 'ACQUIN Germany & Supreme Council of Private Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-guc-iet-cs', faculty_id: 'fac-guc-eng', name_ar: 'هندسة البرمجيات ونظم المعلومات (Software Engineering)', name_en: 'Software Engineering (German Curriculum)', degree_ar: 'بكالوريوس', degree_en: 'B.Sc (German Accr.)', program_type: 'joint_international', program_type_ar: 'منهج ألماني معتمد دولياً', study_system_ar: 'نظام ECTS الأوروبي والساعات المعتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-guc-pharm',
    university_id: 'uni-guc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الصيدلة والتكنولوجيا الحيوية',
    name_en: 'Faculty of Pharmacy & Biotechnology',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصيدلي الألماني',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الصيدلة وتكنولوجيا الدواء والتكنولوجيا الحيوية',
    specialization_en: 'Pharmacy & Pharmaceutical Biotechnology',
    source_verification: 'ACQUIN Germany & NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-guc-pharm-bio', faculty_id: 'fac-guc-pharm', name_ar: 'برنامج الصيدلة والتكنولوجيا الحيوية المزدوج', name_en: 'Pharmacy & Biotechnology Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'joint_international', program_type_ar: 'برنامج ألماني معتمد', study_system_ar: 'ساعات معتمدة ECTS', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 5. NILE UNIVERSITY (جامعة النيل - جامعة بحثية خاصة غير هادفة للربح)
  // --------------------------------------------------------------------------
  {
    id: 'fac-nile-eng',
    university_id: 'uni-nile',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الهندسة والعلوم التطبيقية',
    name_en: 'School of Engineering & Applied Sciences',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي البحثي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة الميكانيكية والمدنية وهندسة النظم والإلكترونيات الطبية',
    specialization_en: 'Mechanical, Civil, Industrial & Electronics Engineering',
    source_verification: 'Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-nile-eng-ind', faculty_id: 'fac-nile-eng', name_ar: 'برنامج الهندسة الصناعية والخدمية وسلاسل الإمداد', name_en: 'Industrial & Service Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج بحثي متقدم', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-nile-cit',
    university_id: 'uni-nile',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية تكنولوجيا المعلومات وعلوم الحاسب',
    name_en: 'School of Information Technology & Computer Science',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي والحاسبات',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'علوم الحاسب والذكاء الاصطناعي والمعلوماتية الحيوية والأمن السيبراني',
    specialization_en: 'Computer Science, Artificial Intelligence & Cybersecurity',
    source_verification: 'Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-nile-cs-ai', faculty_id: 'fac-nile-cit', name_ar: 'برنامج علوم الحاسب والذكاء الاصطناعي (AI)', name_en: 'Artificial Intelligence & Computer Science', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج تكنولوجي متقدم', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  }
];
