import { UniversityFaculty } from '../../types/database.types';

/**
 * COMPREHENSIVE ACCREDITED EGYPTIAN PUBLIC UNIVERSITIES FACULTIES
 * Source: Supreme Council of Universities (SCU) & Ministry of Higher Education Egypt
 */
export const PUBLIC_FACULTIES: UniversityFaculty[] = [
  // --------------------------------------------------------------------------
  // 1. CAIRO UNIVERSITY (جامعة القاهرة)
  // --------------------------------------------------------------------------
  {
    id: 'fac-cu-med',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-kasralainy',
    campus_name_ar: 'المجمع الطبي بقصر العيني',
    campus_name_en: 'Kasr Al-Ainy Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الطب البشري (قصر العيني)',
    name_en: 'Faculty of Medicine (Kasr Al-Ainy)',
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
      { id: 'sp-cu-mbbch', faculty_id: 'fac-cu-med', name_ar: 'بكالوريوس الطب والجراحة العامة (النظام التكاملي 5+2)', name_en: 'Bachelor of Medicine and Surgery (MBBCh 5+2)', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي عام', study_system_ar: 'نظام النقاط المعتمدة التكاملي', is_available: true },
      { id: 'sp-cu-mbbch-ip', faculty_id: 'fac-cu-med', name_ar: 'برنامج قصر العيني الطبي المتكامل بنظام النقاط المعتمدة (IPKA)', name_en: 'Kasr Al-Ainy Integrated Medical Program (IPKA)', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج خاص بمصروفات', study_system_ar: 'ساعات معتمدة معتمدة دولياً', is_available: true }
    ]
  },
  {
    id: 'fac-cu-dent',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-kasralainy',
    campus_name_ar: 'المجمع الطبي بقصر العيني',
    campus_name_en: 'Kasr Al-Ainy Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية طب الفم والأسنان',
    name_en: 'Faculty of Oral & Dental Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان',
    specialization_en: 'Oral & Dental Surgery',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-dent', faculty_id: 'fac-cu-dent', name_ar: 'برنامج طب وجراحة الفم والأسنان (BDS)', name_en: 'Bachelor of Dental Surgery', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-cu-pharm',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-kasralainy',
    campus_name_ar: 'المجمع الطبي بقصر العيني',
    campus_name_en: 'Kasr Al-Ainy Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الصيدلة',
    name_en: 'Faculty of Pharmacy',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي (PharmD) والصيدلة الإكلينيكية',
    specialization_en: 'PharmD & Clinical Pharmacy',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-pharmd', faculty_id: 'fac-cu-pharm', name_ar: 'برنامج دكتور صيدلي (PharmD)', name_en: 'Doctor of Pharmacy Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true },
      { id: 'sp-cu-pharmd-clin', faculty_id: 'fac-cu-pharm', name_ar: 'برنامج دكتور صيدلي الصيدلة الإكلينيكية (PharmD Clinical)', name_en: 'Clinical Pharmacy Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز بمصروفات', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },
  {
    id: 'fac-cu-eng',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-giza',
    campus_name_ar: 'الحرم الرئيسي بالجيزة',
    campus_name_en: 'Main Giza Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المدنية والكهربائية والمعمارية والميكانيكية وهندسة الطيران والحاسبات',
    specialization_en: 'Civil, Architecture, Electrical, Mechanical & Aerospace',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-eng-civ', faculty_id: 'fac-cu-eng', name_ar: 'الهندسة المدنية والإنشائية', name_en: 'Civil Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي عام', study_system_ar: 'ساعات معتمدة (4 سنوات)', is_available: true },
      { id: 'sp-cu-eng-arch', faculty_id: 'fac-cu-eng', name_ar: 'الهندسة المعمارية', name_en: 'Architectural Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي عام', study_system_ar: 'ساعات معتمدة', is_available: true },
      { id: 'sp-cu-eng-aero', faculty_id: 'fac-cu-eng', name_ar: 'هندسة الطيران والفضاء', name_en: 'Aerospace Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج معتمد دولياً', study_system_ar: 'ساعات معتمدة', is_available: true },
      { id: 'sp-cu-eng-cce', faculty_id: 'fac-cu-eng', name_ar: 'هندسة الاتصالات والحاسبات (CCE)', name_en: 'Computer & Communications Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج ساعات معتمدة خاص', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-cu-cai',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-giza',
    campus_name_ar: 'الحرم الرئيسي بالجيزة',
    campus_name_en: 'Main Giza Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الحاسبات والذكاء الاصطناعي',
    name_en: 'Faculty of Computers and Artificial Intelligence',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي والحاسبات',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'علوم الحاسب والذكاء الاصطناعي والأمن السيبراني ونظم المعلومات',
    specialization_en: 'Computer Science, AI, Cybersecurity & Information Systems',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-cs-ai', faculty_id: 'fac-cu-cai', name_ar: 'برنامج الذكاء الاصطناعي التطبيقي (AI)', name_en: 'Applied Artificial Intelligence', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز بمصروفات', study_system_ar: 'ساعات معتمدة', is_available: true },
      { id: 'sp-cu-cs-cyber', faculty_id: 'fac-cu-cai', name_ar: 'برنامج الأمن السيبراني والشبكات', name_en: 'Cybersecurity Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز بمصروفات', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-cu-econ',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-giza',
    campus_name_ar: 'الحرم الرئيسي بالجيزة',
    campus_name_en: 'Main Giza Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الاقتصاد والعلوم السياسية',
    name_en: 'Faculty of Economics and Political Science',
    sector: 'business',
    sector_ar: 'قطاع الاقتصاد والعلوم السياسية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الاقتصاد والعلوم السياسية والإحصاء والإدارة العامة',
    specialization_en: 'Economics, Political Science, Statistics & Public Admin',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-econ-ar', faculty_id: 'fac-cu-econ', name_ar: 'شعبة الاقتصاد العامة باللغة العربية', name_en: 'Economics (Arabic)', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد', study_system_ar: 'ساعات معتمدة', is_available: true },
      { id: 'sp-cu-econ-en', faculty_id: 'fac-cu-econ', name_ar: 'شعبة الاقتصاد والعلوم السياسية باللغة الإنجليزية', name_en: 'Economics & Political Science (English)', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'شعبة لغات بمصروفات', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-cu-comm',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-giza',
    campus_name_ar: 'الحرم الرئيسي بالجيزة',
    campus_name_en: 'Main Giza Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية التجارة وإدارة الأعمال',
    name_en: 'Faculty of Commerce & Business Administration',
    sector: 'business',
    sector_ar: 'قطاع التجارة وإدارة الأعمال',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'المحاسبة وإدارة الأعمال والتجارة باللغة الإنجليزية وبرنامج جورجيا الدولي',
    specialization_en: 'Accounting, Business Admin & English Section',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-comm-ar', faculty_id: 'fac-cu-comm', name_ar: 'شعبة المحاسبة وإدارة الأعمال (عربي)', name_en: 'Commerce (Arabic)', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد', study_system_ar: 'فصلي', is_available: true },
      { id: 'sp-cu-comm-en', faculty_id: 'fac-cu-comm', name_ar: 'برنامج العلوم التجارية باللغة الإنجليزية (English Commerce)', name_en: 'Commerce in English', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'شعبة لغات متميزة', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-cu-masscomm',
    university_id: 'uni-cu',
    campus_id: 'camp-cu-giza',
    campus_name_ar: 'الحرم الرئيسي بالجيزة',
    campus_name_en: 'Main Giza Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الإعلام',
    name_en: 'Faculty of Mass Communication',
    sector: 'humanities',
    sector_ar: 'قطاع الإعلام والاتصال الرقمي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الصحافة والإذاعة والتلفزيون والعلاقات العامة والإعلام الرقمي الإنجليزي',
    specialization_en: 'Journalism, Radio/TV, PR & English Mass Media',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-cu-mc-rtv', faculty_id: 'fac-cu-masscomm', name_ar: 'قسم الإذاعة والتليفزيون والإعلام الرقمي', name_en: 'Radio & TV Department', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 2. AIN SHAMS UNIVERSITY (جامعة عين شمس)
  // --------------------------------------------------------------------------
  {
    id: 'fac-asu-med',
    university_id: 'uni-asu',
    campus_id: 'camp-asu-abbassia',
    campus_name_ar: 'المجمع الطبي بالعباسية',
    campus_name_en: 'Abbassia Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي والبرنامج الموسع (EMP)',
    specialization_en: 'Integrated MBBCh & Extended Modular Program (EMP)',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-asu-mbbch', faculty_id: 'fac-asu-med', name_ar: 'بكالوريوس الطب والجراحة التكاملي (5+2)', name_en: 'MBBCh Integrated Medicine (5+2)', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي عام', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-asu-dent',
    university_id: 'uni-asu',
    campus_id: 'camp-asu-abbassia',
    campus_name_ar: 'المجمع الطبي بالعباسية',
    campus_name_en: 'Abbassia Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية طب الأسنان',
    name_en: 'Faculty of Dentistry',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'طب وجراحة الفم والأسنان',
    specialization_en: 'Dental Surgery',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-asu-dent', faculty_id: 'fac-asu-dent', name_ar: 'برنامج طب وجراحة الفم والأسنان (BDS)', name_en: 'BDS Dental Surgery', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-asu-pharm',
    university_id: 'uni-asu',
    campus_id: 'camp-asu-abbassia',
    campus_name_ar: 'المجمع الطبي بالعباسية',
    campus_name_en: 'Abbassia Medical Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الصيدلة',
    name_en: 'Faculty of Pharmacy',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي (PharmD) والصيدلة الإكلينيكية وتصميم الدواء',
    specialization_en: 'PharmD & Clinical Pharmacy',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-asu-pharmd', faculty_id: 'fac-asu-pharm', name_ar: 'برنامج دكتور صيدلي (PharmD)', name_en: 'PharmD Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },
  {
    id: 'fac-asu-eng',
    university_id: 'uni-asu',
    campus_id: 'camp-asu-abbassia',
    campus_name_ar: 'مجمع العباسية الهندسي',
    campus_name_en: 'Abbassia Engineering Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المدنية والكهربائية والميكانيكية والمعمارية وبرامج الساعات المعتمدة',
    specialization_en: 'Civil, Mechanical, Electrical & Architecture',
    source_verification: 'NAQAAE & EUR-ACE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-asu-eng-mecha', faculty_id: 'fac-asu-eng', name_ar: 'هندسة الميكاترونيات والأتمتة الصناعية', name_en: 'Mechatronics & Automation Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج ساعات معتمدة', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-asu-alsun',
    university_id: 'uni-asu',
    campus_id: 'camp-asu-abbassia',
    campus_name_ar: 'الحرم الرئيسي بالعباسية',
    campus_name_en: 'Abbassia Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الألسن',
    name_en: 'Faculty of Al-Alsun (Languages & Translation)',
    sector: 'humanities',
    sector_ar: 'قطاع اللغات الحية والترجمة الفورية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'اللغات الأوروبية والآسيوية والإفريقية والترجمة الفورية',
    specialization_en: 'European, Asian & African Languages',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-asu-alsun-en', faculty_id: 'fac-asu-alsun', name_ar: 'شعبة اللغة الإنجليزية والترجمة الفورية المتخصصة', name_en: 'English & Translation', degree_ar: 'ليسانس', degree_en: 'BA', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 3. ALEXANDRIA UNIVERSITY (جامعة الإسكندرية)
  // --------------------------------------------------------------------------
  {
    id: 'fac-alex-med',
    university_id: 'uni-alex',
    campus_id: 'camp-alex-chatby',
    campus_name_ar: 'المجمع الطبي بالشاطبي',
    campus_name_en: 'Chatby Medical Campus',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
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
      { id: 'sp-alex-mbbch', faculty_id: 'fac-alex-med', name_ar: 'برنامج الطب والجراحة العامة التكاملي', name_en: 'Integrated MBBCh Medicine', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-alex-eng',
    university_id: 'uni-alex',
    campus_id: 'camp-alex-chatby',
    campus_name_ar: 'مجمع سوتير الهندسي',
    campus_name_en: 'Soter Engineering Campus',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة البحرية وبناء السفن والمدنية والكهربائية والميكانيكية',
    specialization_en: 'Marine Engineering, Naval Architecture & Civil',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-alex-eng-marine', faculty_id: 'fac-alex-eng', name_ar: 'الهندسة البحرية وعمارة السفن', name_en: 'Marine Engineering & Naval Architecture', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج تخصصي نادر', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 4. MANSOURA UNIVERSITY (جامعة المنصورة)
  // --------------------------------------------------------------------------
  {
    id: 'fac-mans-med',
    university_id: 'uni-mans',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    name_ar: 'كلية الطب البشري (مركز زراعة الكلى والمسالك)',
    name_en: 'Faculty of Medicine (Mansoura Kidney & Urology Pioneer)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة والبرنامج الطبي مانشستر الدولي المشترك',
    specialization_en: 'MBBCh Integrated & Mansoura Manchester Medical Program',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-mans-mbbch', faculty_id: 'fac-mans-med', name_ar: 'برنامج الطب والجراحة العامة التكاملي (5+2)', name_en: 'General MBBCh Integrated Medicine', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true },
      { id: 'sp-mans-manchester', faculty_id: 'fac-mans-med', name_ar: 'برنامج المنصورة مانشستر الطبي الدولي المشترك (Manchester)', name_en: 'Mansoura-Manchester Medical Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'joint_international', program_type_ar: 'برنامج دولي بمصروفات معتمدة', study_system_ar: 'نظام مانشستر القائم على حل المشكلات (PBL)', is_available: true }
    ]
  },
  {
    id: 'fac-mans-eng',
    university_id: 'uni-mans',
    governorate_ar: 'الدقهلية',
    governorate_en: 'Dakahlia',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المدنية والاتصالات والميكاترونكس وهندسة الذكاء الاصطناعي',
    specialization_en: 'Civil, Mechatronics, Communications & AI Engineering',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-mans-eng-mecha', faculty_id: 'fac-mans-eng', name_ar: 'هندسة الميكاترونكس والأنظمة الذكية', name_en: 'Mechatronics Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج ساعات معتمدة متميز', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 5. ASSIUT UNIVERSITY (جامعة أسيوط - قطب التعليم العالي بالصعيد)
  // --------------------------------------------------------------------------
  {
    id: 'fac-assiut-med',
    university_id: 'uni-assiut',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    name_ar: 'كلية الطب البشري (مجمع المستشفيات الجامعية التخصصية بأسيوط)',
    name_en: 'Faculty of Medicine (Assiut University)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'General Medicine & Surgery',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-assiut-mbbch', faculty_id: 'fac-assiut-med', name_ar: 'بكالوريوس الطب والجراحة العام التكاملي (5+2)', name_en: 'MBBCh Integrated Medicine & Surgery', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي عام', study_system_ar: 'نظام 5+2 التكاملي', is_available: true },
      { id: 'sp-assiut-med-credit', faculty_id: 'fac-assiut-med', name_ar: 'البرنامج الطبي الموسع بنظام النقاط والساعات المعتمدة', name_en: 'Assiut Integrated Credit Points Medical Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز بمصروفات', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-assiut-pharm',
    university_id: 'uni-assiut',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    name_ar: 'كلية الصيدلة',
    name_en: 'Faculty of Pharmacy (Assiut)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'فارم دي كلينيكال وتصنيع دوائي',
    specialization_en: 'PharmD & Clinical Pharmacy',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-assiut-pharmd', faculty_id: 'fac-assiut-pharm', name_ar: 'برنامج دكتور صيدلي - فارم دي (PharmD)', name_en: 'Doctor of Pharmacy Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: '5 سنوات + سنة تدريب', is_available: true },
      { id: 'sp-assiut-pharm-clin', faculty_id: 'fac-assiut-pharm', name_ar: 'برنامج الصيدلة الإكلينيكية (PharmD Clinical)', name_en: 'Clinical Pharmacy Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'credit_hours', program_type_ar: 'ساعات معتمدة', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-assiut-eng',
    university_id: 'uni-assiut',
    governorate_ar: 'أسيوط',
    governorate_en: 'Assiut',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering (Assiut)',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة التشييد والبناء، ميكاترونكس، هندسة القوى الكهربائية',
    specialization_en: 'Civil, Mechatronics, Electrical Power',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-assiut-eng-mecha', faculty_id: 'fac-assiut-eng', name_ar: 'برنامج هندسة الميكاترونكس والروبوتات', name_en: 'Mechatronics & Robotics Engineering', degree_ar: 'بكالوريوس هندسة معتمد', degree_en: 'B.Sc. in Mechatronics', program_type: 'credit_hours', program_type_ar: 'ساعات معتمدة', study_system_ar: 'ساعات معتمدة', is_available: true },
      { id: 'sp-assiut-eng-civil', faculty_id: 'fac-assiut-eng', name_ar: 'هندسة التشييد وإدارة المشروعات', name_en: 'Construction Engineering & Project Management', degree_ar: 'بكالوريوس هندسة معتمد', degree_en: 'B.Sc. in Civil Engineering', program_type: 'credit_hours', program_type_ar: 'ساعات معتمدة', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 6. HELWAN UNIVERSITY (جامعة حلوان)
  // --------------------------------------------------------------------------
  {
    id: 'fac-helwan-eng-helwan',
    university_id: 'uni-helwan',
    campus_id: 'camp-helwan-ainhelwan',
    campus_name_ar: 'الحرم الرئيسي بعين حلوان',
    campus_name_en: 'Ain Helwan Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الهندسة بحلوان',
    name_en: 'Faculty of Engineering at Helwan',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الميكانيكا الحيوية والاتصالات وهندسة القوى الكهربائية والحاسبات',
    specialization_en: 'Biomedical, Communications & Electrical Power Engineering',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-helwan-eng-biomed', faculty_id: 'fac-helwan-eng-helwan', name_ar: 'هندسة الأجهزة الطبية الحيوية والمنظومات', name_en: 'Biomedical Engineering & Systems', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-helwan-eng-mataria',
    university_id: 'uni-helwan',
    campus_id: 'camp-helwan-mataria',
    campus_name_ar: 'مجمع المطرية الهندسي',
    campus_name_en: 'Mataria Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الهندسة بالمطرية',
    name_en: 'Faculty of Engineering at Mataria',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة السيارات والجرارات والهندسة المعمارية والإنشائية',
    specialization_en: 'Automotive Engineering, Architecture & Structural Engineering',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-mataria-auto', faculty_id: 'fac-helwan-eng-mataria', name_ar: 'هندسة السيارات والجرارات والمركبات الذكية', name_en: 'Automotive & Tractors Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي تخصصي رائد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-helwan-applied-arts',
    university_id: 'uni-helwan',
    campus_id: 'camp-helwan-ainhelwan',
    campus_name_ar: 'الحرم الرئيسي',
    campus_name_en: 'Main Campus',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية الفنون التطبيقية (الدقي / الأورمان)',
    name_en: 'Faculty of Applied Arts',
    sector: 'humanities',
    sector_ar: 'قطاع الفنون والتصميم الصناعي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'التصميم الصناعي والتصميم الداخلي والأثاث والإعلان والطباعة والتصوير والسينما',
    specialization_en: 'Industrial Design, Interior Design & Cinema Technology',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-helwan-interior', faculty_id: 'fac-helwan-applied-arts', name_ar: 'قسم التصميم الداخلي والأثاث والعمارة الداخلية', name_en: 'Interior Design & Furniture', degree_ar: 'بكالوريوس فنون تطبيقية', degree_en: 'B.Sc. Applied Arts', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-helwan-fine-arts',
    university_id: 'uni-helwan',
    campus_id: 'camp-helwan-zamalek',
    campus_name_ar: 'مجمع الزمالك',
    campus_name_en: 'Zamalek Campus',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الفنون الجميلة بالزمالك',
    name_en: 'Faculty of Fine Arts at Zamalek',
    sector: 'humanities',
    sector_ar: 'قطاع الفنون والعمارة',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'العمارة والتصوير والديكور والجرافيك والنحت',
    specialization_en: 'Architecture, Painting, Decor & Graphics',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-helwan-fa-arch', faculty_id: 'fac-helwan-fine-arts', name_ar: 'قسم العمارة (فنون جميلة الزمالك)', name_en: 'Architecture Department', degree_ar: 'بكالوريوس هندسة معمارية', degree_en: 'B.Arch', program_type: 'general', program_type_ar: 'برنامج حكومي عريق', study_system_ar: 'فصلي', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 6. ZAGAZIG UNIVERSITY (جامعة الزقازيق)
  // --------------------------------------------------------------------------
  {
    id: 'fac-zag-med',
    university_id: 'uni-zag',
    governorate_ar: 'الشرقية',
    governorate_en: 'Sharkia',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'MBBCh Integrated Medicine',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-zag-mbbch', faculty_id: 'fac-zag-med', name_ar: 'بكالوريوس الطب والجراحة العامة التكاملي', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-zag-eng',
    university_id: 'uni-zag',
    governorate_ar: 'الشرقية',
    governorate_en: 'Sharkia',
    name_ar: 'كلية الهندسة',
    name_en: 'Faculty of Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة الإنشائية والبيئية والميكانيكية والميكاترونكس',
    specialization_en: 'Civil, Environmental & Mechatronics Engineering',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-zag-eng-civ', faculty_id: 'fac-zag-eng', name_ar: 'برنامج الهندسة الإنشائية وإدارة التشييد', name_en: 'Structural & Construction Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج متميز', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 7. TANTA UNIVERSITY (جامعة طنطا)
  // --------------------------------------------------------------------------
  {
    id: 'fac-tanta-med',
    university_id: 'uni-tanta',
    governorate_ar: 'الغربية',
    governorate_en: 'Gharbia',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'MBBCh Integrated Medicine',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-tanta-mbbch', faculty_id: 'fac-tanta-med', name_ar: 'بكالوريوس الطب والجراحة التكاملي', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-tanta-pharm',
    university_id: 'uni-tanta',
    governorate_ar: 'الغربية',
    governorate_en: 'Gharbia',
    name_ar: 'كلية الصيدلة',
    name_en: 'Faculty of Pharmacy',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصيدلي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'دكتور صيدلي (PharmD) والصيدلة الإكلينيكية',
    specialization_en: 'Doctor of Pharmacy (PharmD)',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-tanta-pharmd', faculty_id: 'fac-tanta-pharm', name_ar: 'برنامج دكتور صيدلي الصيدلة الإكلينيكية', name_en: 'Clinical PharmD Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة (5+1)', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 8. SUEZ CANAL UNIVERSITY (جامعة قناة السويس)
  // --------------------------------------------------------------------------
  {
    id: 'fac-suezcanal-med',
    university_id: 'uni-suez-canal',
    governorate_ar: 'الإسماعيلية',
    governorate_en: 'Ismailia',
    name_ar: 'كلية الطب البشري الرائدة في التعليم المجتمعي',
    name_en: 'Faculty of Medicine (Pioneer in Community-Based Education)',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة والتعليم الموجه نحو المجتمع (FOMSCU)',
    specialization_en: 'Community-Based Integrated MBBCh Medicine',
    source_verification: 'NAQAAE & WHO Collaborating Centre',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-scu-mbbch', faculty_id: 'fac-suezcanal-med', name_ar: 'برنامج الطب والجراحة العامة الموجه نحو صحة المجتمع', name_en: 'Community-Based MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي معتمد دولياً من منظمة الصحة العالمية', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },
  {
    id: 'fac-suezcanal-dent',
    university_id: 'uni-suez-canal',
    governorate_ar: 'الإسماعيلية',
    governorate_en: 'Ismailia',
    name_ar: 'كلية طب جراحة الفم والأسنان',
    name_en: 'Faculty of Dentistry',
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
      { id: 'sp-scu-dent', faculty_id: 'fac-suezcanal-dent', name_ar: 'برنامج طب وجراحة الأسنان', name_en: 'BDS Dental Surgery', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 9. SUEZ UNIVERSITY (جامعة السويس - هندسة البترول والتعدين)
  // --------------------------------------------------------------------------
  {
    id: 'fac-suez-petro',
    university_id: 'uni-suez',
    governorate_ar: 'السويس',
    governorate_en: 'Suez',
    name_ar: 'كلية هندسة البترول والتعدين',
    name_en: 'Faculty of Petroleum & Mining Engineering',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والبترولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة البترول والتكرير والغاز الطبيعي وهندسة الفلزات والمناجم',
    specialization_en: 'Petroleum, Refining, Natural Gas & Mining Engineering',
    source_verification: 'NAQAAE & Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-suez-petro', faculty_id: 'fac-suez-petro', name_ar: 'قسم هندسة البترول والحفر والإنتاج', name_en: 'Petroleum Drilling & Production Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج حكومي متخصص رائد', study_system_ar: 'ساعات معتمدة', is_available: true },
      { id: 'sp-suez-refine', faculty_id: 'fac-suez-petro', name_ar: 'قسم هندسة تكرير البترول والبتروكيماويات', name_en: 'Petroleum Refining & Petrochemicals', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج معتمد دولياً', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 10. BENHA UNIVERSITY (جامعة بنها)
  // --------------------------------------------------------------------------
  {
    id: 'fac-benha-eng-shoubra',
    university_id: 'uni-benha',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية الهندسة بشبرا',
    name_en: 'Faculty of Engineering at Shoubra',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المساحية والجيوديسية والمدنية والكهربائية والميكانيكية',
    specialization_en: 'Surveying, Geodesy, Civil & Mechanical Engineering',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-shoubra-survey', faculty_id: 'fac-benha-eng-shoubra', name_ar: 'هندسة المساحة والجيوماتكس والاستشعار عن بعد', name_en: 'Surveying & Geomatics Engineering', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'distinguished', program_type_ar: 'برنامج تخصصي رائد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-benha-med',
    university_id: 'uni-benha',
    governorate_ar: 'القليوبية',
    governorate_en: 'Qalyubia',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'MBBCh Integrated Medicine',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-benha-mbbch', faculty_id: 'fac-benha-med', name_ar: 'بكالوريوس الطب والجراحة التكاملي', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 11. KAFR EL-SHEIKH UNIVERSITY (جامعة كفر الشيخ)
  // --------------------------------------------------------------------------
  {
    id: 'fac-kfs-fisheries',
    university_id: 'uni-kfs',
    governorate_ar: 'كفر الشيخ',
    governorate_en: 'Kafr El-Sheikh',
    name_ar: 'كلية علوم الثروة السمكية والمصايد',
    name_en: 'Faculty of Fisheries & Aquaculture Sciences',
    sector: 'humanities',
    sector_ar: 'قطاع الاستزراع المائي والثروة السمكية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الاستزراع المائي وتصنيع الأسماك وتكنولوجيا المصايد والملاحة البحرية',
    specialization_en: 'Aquaculture, Fish Processing & Marine Fishing Technology',
    source_verification: 'NAQAAE & Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-kfs-aquaculture', faculty_id: 'fac-kfs-fisheries', name_ar: 'برنامج تكنولوجيا الاستزراع المائي وتفريخ الأسماك', name_en: 'Aquaculture Technology Program', degree_ar: 'بكالوريوس علوم ثروة سمكية', degree_en: 'B.Sc. in Fisheries', program_type: 'general', program_type_ar: 'برنامج حكومي تخصصي رائد بالشرق الأوسط', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-kfs-med',
    university_id: 'uni-kfs',
    governorate_ar: 'كفر الشيخ',
    governorate_en: 'Kafr El-Sheikh',
    name_ar: 'كلية الطب البشري',
    name_en: 'Faculty of Medicine',
    sector: 'medical',
    sector_ar: 'القطاع الطبي والصحي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الطب والجراحة العامة التكاملي (5+2)',
    specialization_en: 'MBBCh Integrated Medicine',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-kfs-mbbch', faculty_id: 'fac-kfs-med', name_ar: 'بكالوريوس الطب والجراحة العامة (5+2)', name_en: 'Integrated MBBCh Program', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'نقاط معتمدة تكاملي', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 12. MENOUFIA UNIVERSITY (جامعة المنوفية - هندسة الإلكترونيات بمنوف)
  // --------------------------------------------------------------------------
  {
    id: 'fac-menoufia-elc',
    university_id: 'uni-menoufia',
    governorate_ar: 'المنوفية',
    governorate_en: 'Menoufia',
    name_ar: 'كلية الهندسة الإلكترونية بمنوف',
    name_en: 'Faculty of Electronic Engineering in Menouf',
    sector: 'engineering',
    sector_ar: 'القطاع الهندسي والتكنولوجي المتخصص',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة الإلكترونيات والاتصالات وهندسة الحاسبات وهندسة التحكم والأنظمة الصناعية',
    specialization_en: 'Electronics, Communications, Computer Engineering & Industrial Control',
    source_verification: 'NAQAAE & Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-menouf-cse', faculty_id: 'fac-menoufia-elc', name_ar: 'هندسة وعلوم الحاسبات والأنظمة الذكية المدمجة', name_en: 'Computer Science & Embedded Systems', degree_ar: 'بكالوريوس هندسة معتمد', degree_en: 'B.Sc. in Computer Engineering', program_type: 'general', program_type_ar: 'برنامج تخصصي هندسي رائد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 13. LUXOR UNIVERSITY (جامعة الأقصر - الفنون الجميلة والآثار)
  // --------------------------------------------------------------------------
  {
    id: 'fac-luxor-finearts',
    university_id: 'uni-luxor',
    governorate_ar: 'الأقصر',
    governorate_en: 'Luxor',
    name_ar: 'كلية الفنون الجميلة بالأقصر',
    name_en: 'Faculty of Fine Arts in Luxor',
    sector: 'humanities',
    sector_ar: 'قطاع الفنون التشكيلية والتراث',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'التصوير الجداري والرسم والجرافيك والنحت والديكور',
    specialization_en: 'Mural Painting, Graphics, Sculpture & Fine Arts',
    source_verification: 'NAQAAE Accredited',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-luxor-mural', faculty_id: 'fac-luxor-finearts', name_ar: 'قسم التصوير الجداري وتراث الفنون المصرية القديمة', name_en: 'Mural Arts & Ancient Heritage', degree_ar: 'بكالوريوس فنون جميلة', degree_en: 'B.F.A.', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'فصلي', is_available: true }
    ]
  },
  {
    id: 'fac-luxor-archaeology',
    university_id: 'uni-luxor',
    governorate_ar: 'الأقصر',
    governorate_en: 'Luxor',
    name_ar: 'كلية الآثار بالأقصر',
    name_en: 'Faculty of Archaeology in Luxor',
    sector: 'humanities',
    sector_ar: 'قطاع الآثار وترميم المومياوات والمقابر',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الآثار المصرية القديمة وترميم الآثار في قلب أكبر متحف مفتوح بالعالم',
    specialization_en: 'Egyptology & Monument Conservation (Luxor Open-Air Museum)',
    source_verification: 'Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-luxor-egyptology', faculty_id: 'fac-luxor-archaeology', name_ar: 'الآثار المصرية الميدانية وترميم المواقع الأثرية', name_en: 'Field Egyptology & Monument Conservation', degree_ar: 'ليسانس آثار', degree_en: 'BA Archaeology', program_type: 'distinguished', program_type_ar: 'برنامج ميداني فريد بالأقصر', study_system_ar: 'ساعات معتمدة مع تدريب ميداني بالمقابر الملكية', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 14. MATROUH UNIVERSITY (جامعة مطروح - البترول والتعدين والزراعة الصحراوية)
  // --------------------------------------------------------------------------
  {
    id: 'fac-matrouh-petro',
    university_id: 'uni-matrouh',
    governorate_ar: 'مطروح',
    governorate_en: 'Matrouh',
    name_ar: 'كلية علوم البترول والتعدين بمطروح',
    name_en: 'Faculty of Petroleum & Mining Sciences in Matrouh',
    sector: 'humanities',
    sector_ar: 'قطاع علوم البترول والغاز والجيولوجيا',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'جيولوجيا البترول والغاز الطبيعي وجيوفيزياء التعدين بالصحراء الغربية',
    specialization_en: 'Petroleum Geology & Mining Geophysics',
    source_verification: 'Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-matrouh-petro-geo', faculty_id: 'fac-matrouh-petro', name_ar: 'جيولوجيا البترول والغاز واستكشاف حقول الصحراء الغربية', name_en: 'Petroleum & Gas Exploration Geology', degree_ar: 'بكالوريوس علوم بترول', degree_en: 'B.Sc. in Petroleum Sciences', program_type: 'general', program_type_ar: 'برنامج حكومي تخصصي', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },

  // --------------------------------------------------------------------------
  // 15. ARISH UNIVERSITY (جامعة العريش - الاستزراع البحري والمصايد)
  // --------------------------------------------------------------------------
  {
    id: 'fac-arish-fisheries',
    university_id: 'uni-arish',
    governorate_ar: 'شمال سيناء',
    governorate_en: 'North Sinai',
    name_ar: 'كلية الاستزراع المائي والمصايد البحرية بالعريش',
    name_en: 'Faculty of Aquaculture & Marine Fisheries in Arish',
    sector: 'humanities',
    sector_ar: 'قطاع الثروة المائية والبحرية بسيناء',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'تكنولوجيا الاستزراع البحري والمصايد السمكية بالبحر المتوسط وبحيرة البردويل',
    specialization_en: 'Marine Aquaculture & Bardawil Fisheries Tech',
    source_verification: 'Supreme Council of Universities',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-arish-marine-aqua', faculty_id: 'fac-arish-fisheries', name_ar: 'الاستزراع السمكي البحري وتنمية بحيرة البردويل', name_en: 'Marine Aquaculture & Fisheries Development', degree_ar: 'بكالوريوس', degree_en: 'Bachelor', program_type: 'general', program_type_ar: 'برنامج معتمد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  }
];
