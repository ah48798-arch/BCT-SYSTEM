import { UniversityFaculty } from '../../types/database.types';

/**
 * COMPREHENSIVE ACCREDITED TECHNOLOGICAL, INTERNATIONAL & SPECIAL NATURE FACULTIES
 * Source: Ministry of Higher Education Egypt, Supreme Council of Universities, International Treaties
 */
export const TECH_AND_INTERNATIONAL_FACULTIES: UniversityFaculty[] = [
  // ==========================================================================
  // 1. EGYPTIAN TECHNOLOGICAL UNIVERSITIES (الجامعات التكنولوجية المعتمدة - 10 جامعات)
  // ==========================================================================
  {
    id: 'fac-nctu-iet',
    university_id: 'uni-nctu',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية تكنولوجيا الصناعة والطاقة بالتجمع الخامس',
    name_en: 'Faculty of Industry & Energy Technology (New Cairo)',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي التطبيقي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'تكنولوجيا الأوتوترونكس وتكنولوجيا المعلومات وتكنولوجيا الطاقة الجديدة والمتجددة والأطراف الصناعية',
    specialization_en: 'Autotronics, Information Technology, Renewable Energy & Prosthetics',
    source_verification: 'Ministry of Higher Education (Law 72 of 2019)',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-nctu-auto', faculty_id: 'fac-nctu-iet', name_ar: 'برنامج تكنولوجيا الأوتوترونكس والسيارات الكهربائية', name_en: 'Autotronics & Electric Vehicles Technology', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'general', program_type_ar: 'برنامج حكومي تكنولوجي معتمد', study_system_ar: 'ساعات معتمدة (2+2 نظام تكنولوجي)', is_available: true },
      { id: 'sp-nctu-it', faculty_id: 'fac-nctu-iet', name_ar: 'برنامج تكنولوجيا المعلومات والشبكات الذكية', name_en: 'Information Technology & Smart Networks', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'general', program_type_ar: 'برنامج حكومي تكنولوجي', study_system_ar: 'ساعات معتمدة تكنولوجية', is_available: true },
      { id: 'sp-nctu-prosthetics', faculty_id: 'fac-nctu-iet', name_ar: 'برنامج تكنولوجيا الأطراف الصناعية والأجهزة التقويمية', name_en: 'Prosthetics & Orthotics Technology', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'distinguished', program_type_ar: 'برنامج تطبيقي تخصصي نادر', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-dtu-iet',
    university_id: 'uni-dtu',
    governorate_ar: 'المنوفية',
    governorate_en: 'Menoufia',
    name_ar: 'كلية تكنولوجيا الصناعة والطاقة بقويسنا',
    name_en: 'Faculty of Industry & Energy Technology in Quesna',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي التطبيقي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الميكاترونكس والأوتوترونكس وتكنولوجيا التبريد والتكييف وتكنولوجيا المعلومات',
    specialization_en: 'Mechatronics, Autotronics, HVAC & Information Technology',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-dtu-mecha', faculty_id: 'fac-dtu-iet', name_ar: 'برنامج تكنولوجيا الميكاترونكس والأتمتة الصناعية', name_en: 'Mechatronics Technology', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'general', program_type_ar: 'برنامج تكنولوجي معتمد', study_system_ar: 'ساعات معتمدة (2+2)', is_available: true }
    ]
  },
  {
    id: 'fac-bstu-iet',
    university_id: 'uni-bstu',
    governorate_ar: 'بني سويف',
    governorate_en: 'Beni Suef',
    name_ar: 'الكلية المصرية الكورية لتكنولوجيا الصناعة والطاقة',
    name_en: 'Egyptian-Korean Faculty of Industry & Energy Technology',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي التطبيقي الدولي (شراكة كورية كويكا KOICA)',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الميكاترونكس وتكنولوجيا المعلومات وتكنولوجيا الأجهزة الدقيقة بالتعاون مع وكالة كويكا الكورية',
    specialization_en: 'Mechatronics & ICT (Korean KOICA Partnership)',
    source_verification: 'KOICA Korea & Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-bstu-korean-ict', faculty_id: 'fac-bstu-iet', name_ar: 'برنامج تكنولوجيا المعلومات والاتصالات بالشراكة الكورية (ICT)', name_en: 'Korean ICT Technology Program', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'joint_international', program_type_ar: 'شراكة كورية دولية معتمدة', study_system_ar: 'ساعات معتمدة كورية متقدمة', is_available: true }
    ]
  },
  {
    id: 'fac-batu-iet',
    university_id: 'uni-batu',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    name_ar: 'كلية تكنولوجيا الصناعة والطاقة ببرج العرب',
    name_en: 'Faculty of Industry & Energy Technology in Borg El Arab',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي التطبيقي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'تكنولوجيا تشغيل وصيانة ماكينات الغزل والنسيج والصناعات الغذائية والمستحضرات الدوائية',
    specialization_en: 'Textile Machinery, Food Tech & Pharma Manufacturing',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-batu-textile', faculty_id: 'fac-batu-iet', name_ar: 'تكنولوجيا صناعات الغزل والنسيج الحديثة', name_en: 'Textile Industry Technology', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'general', program_type_ar: 'برنامج حكومي تكنولوجي', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-o6tu-iet',
    university_id: 'uni-o6tu',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'كلية تكنولوجيا الصناعة والطاقة بالسادس من أكتوبر',
    name_en: 'Faculty of Industry & Energy Technology in 6th of October',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي التطبيقي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'تكنولوجيا الأجهزة الطبية والتصنيع الميكانيكي وتكنولوجيا السيارات',
    specialization_en: 'Medical Equipment Tech & Mechanical Manufacturing',
    source_verification: 'Ministry of Higher Education',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-o6tu-biomed', faculty_id: 'fac-o6tu-iet', name_ar: 'برنامج تكنولوجيا صيانة الأجهزة الطبية الحيوية', name_en: 'Biomedical Equipment Technology', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech', program_type: 'distinguished', program_type_ar: 'برنامج تكنولوجي صحي', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-miu-tech-iet',
    university_id: 'uni-miu-tech',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'الكلية التكنولوجية المصرية الألمانية بأسيوط والقاهرة (مصر الدولية التكنولوجية)',
    name_en: 'Egyptian-German Technology College (Misr Intl Tech Univ)',
    sector: 'engineering',
    sector_ar: 'القطاع التكنولوجي الدولي (شراكة ألمانية وإيطالية)',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'تكنولوجيا الكهرباء والإلكترونيات وتكنولوجيا الميكانيكا بنظام التعليم الفني التكنولوجي الألماني المزدوج',
    specialization_en: 'Electrical, Electronics & Mechanical Dual Tech Degree',
    source_verification: 'State of Baden-Württemberg Germany & MoHESR',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-mitu-german-elec', faculty_id: 'fac-miu-tech-iet', name_ar: 'برنامج تكنولوجيا الإلكترونيات المزدوج المعتمد ألمانياً', name_en: 'German Dual Degree Electronics Tech', degree_ar: 'بكالوريوس تكنولوجي', degree_en: 'B.Tech (Dual)', program_type: 'joint_international', program_type_ar: 'شهادة ألمانية دولية معتمدة', study_system_ar: 'نظام التعليم المزدوج التكنولوجي', is_available: true }
    ]
  },

  // ==========================================================================
  // 2. INTERNATIONAL BRANCH CAMPUSES IN NEW ADMINISTRATIVE CAPITAL
  // (أفرع الجامعات الأجنبية والدولية المعتمدة بالعاصمة الإدارية الجديدة)
  // ==========================================================================
  {
    id: 'fac-uofcanada-upei',
    university_id: 'uni-uofcanada',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'فرع جامعة جزيرة الأمير إدوارد الكندية (UPEI Canada)',
    name_en: 'University of Prince Edward Island (UPEI Canadian Campus)',
    sector: 'engineering',
    sector_ar: 'قطاع فروع الجامعات الأجنبية الكندية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة التصميم المستدام وعلوم الحاسب والذكاء الاصطناعي وريادة الأعمال (شهادة كندية أصلية)',
    specialization_en: 'Sustainable Design Engineering, Computer Science & Business',
    source_verification: 'Law 162 of 2018 (Foreign University Branches in Egypt)',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-upei-sde', faculty_id: 'fac-uofcanada-upei', name_ar: 'بكالوريوس هندسة التصميم المستدام (شهادة جامعة UPEI الكندية)', name_en: 'Bachelor of Science in Sustainable Design Engineering', degree_ar: 'بكالوريوس كندي', degree_en: 'B.Sc. Eng (Canada)', program_type: 'joint_international', program_type_ar: 'شهادة كندية أصلية 100% معتمدة في كندا ومصر', study_system_ar: 'نظام الساعات المعتمدة الكندي', is_available: true },
      { id: 'sp-upei-cs-video', faculty_id: 'fac-uofcanada-upei', name_ar: 'علوم الحاسب والذكاء الاصطناعي وتطوير ألعاب الفيديو (Gaming & AI)', name_en: 'Computer Science (Video Gaming & AI Specialization)', degree_ar: 'بكالوريوس كندي', degree_en: 'B.Sc. (Canada)', program_type: 'joint_international', program_type_ar: 'شهادة كندية أصلية', study_system_ar: 'ساعات معتمدة كندية', is_available: true }
    ]
  },
  {
    id: 'fac-eue-london',
    university_id: 'uni-eue',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'فرع جامعة لندن وكلية لندن للاقتصاد (LSE / UCL / King\'s College)',
    name_en: 'University of London Programs (Lead College: LSE, King\'s, UCL)',
    sector: 'business',
    sector_ar: 'قطاع فروع الجامعات البريطانية الدولية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الاقتصاد والتمويل والإدارة والقانون والعلوم السياسية تحت الإشراف الأكاديمي لكلية لندن للاقتصاد LSE',
    specialization_en: 'Economics, Management, Finance & Law (Directed by LSE)',
    source_verification: 'University of London & Presidential Decree 86 of 2021',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-eue-lse-emf', faculty_id: 'fac-eue-london', name_ar: 'بكالوريوس الاقتصاد والتمويل والمحاسبة (إشراف LSE لندن)', name_en: 'BSc Economics & Finance (Academic Direction by LSE)', degree_ar: 'بكالوريوس بريطاني', degree_en: 'B.Sc (Univ of London)', program_type: 'joint_international', program_type_ar: 'شهادة بريطانية أصلية من جامعة لندن', study_system_ar: 'نظام الساعات المعتمدة البريطاني الدولي', is_available: true },
      { id: 'sp-eue-london-llb', faculty_id: 'fac-eue-london', name_ar: 'ليسانس الحقوق البريطاني (Bachelor of Laws - LLB London)', name_en: 'Bachelor of Laws (LLB - University of London)', degree_ar: 'ليسانس بريطاني', degree_en: 'LLB (Univ of London)', program_type: 'joint_international', program_type_ar: 'شهادة بريطانية معتمدة عالمياً ومحلياً', study_system_ar: 'نظام القانون البريطاني', is_available: true }
    ]
  },
  {
    id: 'fac-eue-uclan-eng',
    university_id: 'uni-eue',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'فرع جامعة سنترال لانكشاير البريطانية (UCLan Engineering)',
    name_en: 'University of Central Lancashire (UCLan School of Engineering)',
    sector: 'engineering',
    sector_ar: 'قطاع فروع الجامعات البريطانية الدولية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'هندسة الميكاترونكس وهندسة الطيران وهندسة الروبوتات والذكاء الاصطناعي (شهادة بريطانية)',
    specialization_en: 'Mechatronics, Aerospace & Robotics Engineering (UCLan)',
    source_verification: 'UCLan UK & Presidential Decree',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-eue-uclan-mecha', faculty_id: 'fac-eue-uclan-eng', name_ar: 'بكالوريوس هندسة الميكاترونكس والأنظمة الذكية (UCLan)', name_en: 'BEng (Hons) Mechatronics & Intelligent Machines', degree_ar: 'بكالوريوس بريطاني', degree_en: 'BEng (UK)', program_type: 'joint_international', program_type_ar: 'شهادة بريطانية معتمدة من UCLan', study_system_ar: 'نظام الساعات المعتمدة البريطاني', is_available: true }
    ]
  },
  {
    id: 'fac-tkh-coventry',
    university_id: 'uni-tkh',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'فرع جامعة كوفنتري البريطانية بالعاصمة الإدارية (Coventry University)',
    name_en: 'Coventry University Branch (The Knowledge Hub)',
    sector: 'engineering',
    sector_ar: 'قطاع فروع الجامعات البريطانية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة المدنية والميكانيكية وعلوم الحاسب والذكاء الاصطناعي والتصميم الرقمي والأعمال (شهادة بريطانية أصلية)',
    specialization_en: 'Civil, Computing, Ethical Hacking & Digital Design (UK Degree)',
    source_verification: 'Coventry University UK & Presidential Decree 423 of 2019',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-tkh-coventry-hacking', faculty_id: 'fac-tkh-coventry', name_ar: 'بكالوريوس الأمن السيبراني والاختراق الأخلاقي (Ethical Hacking & Cybersecurity)', name_en: 'BSc (Hons) Ethical Hacking & Cybersecurity', degree_ar: 'بكالوريوس بريطاني', degree_en: 'B.Sc (Coventry UK)', program_type: 'joint_international', program_type_ar: 'شهادة كوفنتري البريطانية الأصلية', study_system_ar: 'ساعات معتمدة بريطانية', is_available: true }
    ]
  },
  {
    id: 'fac-giu-german',
    university_id: 'uni-giu',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'الجامعة الألمانية الدولية بالعاصمة الإدارية (تحالف الجامعات التطبيقية الألمانية HAW)',
    name_en: 'German International University (Consortium of German Applied Universities)',
    sector: 'engineering',
    sector_ar: 'قطاع الجامعات الألمانية الدولية التطبيقية',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة الميكاترونية والسيارات وعلوم الحاسب والأتمتة الصناعية وإدارة الأعمال الألمانية',
    specialization_en: 'Mechatronics, Automotive, Computer Science & German Business',
    source_verification: 'German Consortium (UAS7/HAW) & Presidential Decree',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-giu-automotive', faculty_id: 'fac-giu-german', name_ar: 'بكالوريوس هندسة السيارات والتنقل الذكي (Automotive Engineering)', name_en: 'Automotive & Smart Mobility Engineering', degree_ar: 'بكالوريوس ألماني', degree_en: 'B.Sc (German Accr.)', program_type: 'joint_international', program_type_ar: 'شهادة ألمانية معتمدة دولياً ومحلياً', study_system_ar: 'نظام ECTS الأوروبي', is_available: true }
    ]
  },

  // ==========================================================================
  // 3. SPECIAL NATURE INSTITUTIONS & ACADEMIES (جامعات ذات طبيعة خاصة واتفاقيات دولية)
  // ==========================================================================
  {
    id: 'fac-auc-sse',
    university_id: 'uni-auc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية العلوم والهندسة بالجامعة الأمريكية بالقاهرة (AUC New Cairo)',
    name_en: 'School of Sciences and Engineering (AUC)',
    sector: 'engineering',
    sector_ar: 'قطاع الجامعات الأمريكية ذات الطبيعة الخاصة',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'علوم الحاسب والهندسة المعمارية والميكانيكية والإلكترونية وهندسة البترول (معتمدة من ABET الأمريكية وMSCHE)',
    specialization_en: 'Computer Science, Mechanical, Petroleum & Architectural (ABET Accredited)',
    source_verification: 'ABET USA & Middle States Commission on Higher Education (MSCHE)',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-auc-cs', faculty_id: 'fac-auc-sse', name_ar: 'بكالوريوس علوم الحاسب (معتمد من ABET الأمريكية)', name_en: 'Bachelor of Science in Computer Science', degree_ar: 'بكالوريوس أمريكي', degree_en: 'B.Sc. (ABET Accredited)', program_type: 'joint_international', program_type_ar: 'شهادة أمريكية معتمدة من ABET وMSCHE ومصر', study_system_ar: 'نظام الساعات المعتمدة الأمريكي', is_available: true }
    ]
  },
  {
    id: 'fac-auc-bus',
    university_id: 'uni-auc',
    governorate_ar: 'القاهرة',
    governorate_en: 'Cairo',
    name_ar: 'كلية إدارة الأعمال بالجامعة الأمريكية بالقاهرة (حائزة على التاج الثلاثي Triple Crown)',
    name_en: 'School of Business (AUC - Triple Crown Accredited AACSB/AMBA/EQUIS)',
    sector: 'business',
    sector_ar: 'قطاع إدارة الأعمال والاقتصاد الدولي',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'التمويل والمحاسبة والتسويق وريادة الأعمال والاقتصاد (معتمدة من AACSB, AMBA, EQUIS العالمية)',
    specialization_en: 'Finance, Marketing, Entrepreneurship & Economics (Triple Crown)',
    source_verification: 'AACSB, AMBA & EQUIS (Triple Crown Business Accreditation)',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-auc-bba', faculty_id: 'fac-auc-bus', name_ar: 'بكالوريوس إدارة الأعمال (BBA - الاعتماد الثلاثي الدولي)', name_en: 'Bachelor of Business Administration (BBA)', degree_ar: 'بكالوريوس أمريكي', degree_en: 'BBA (Triple Crown)', program_type: 'joint_international', program_type_ar: 'شهادة إدارة أعمال ذات تصنيف عالمي معتمد', study_system_ar: 'ساعات معتمدة أمريكية', is_available: true }
    ]
  },
  {
    id: 'fac-ejust-eng',
    university_id: 'uni-ejust',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    name_ar: 'كلية الهندسة والعلوم المبتكرة بالجامعة المصرية اليابانية للعلوم والتكنولوجيا (E-JUST)',
    name_en: 'School of Innovative Engineering (E-JUST Alexandria)',
    sector: 'engineering',
    sector_ar: 'قطاع الجامعات البحثية الدولية ذات الطبيعة الخاصة (اتفاقية ثنائية مصرية يابانية)',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الميكاترونكس والروبوتات وعلوم المواد والنانوتكنولوجي والذكاء الاصطناعي والإلكترونيات بنظام التعليم البحثي الياباني',
    specialization_en: 'Mechatronics, Robotics, Materials Science & AI (Japanese Model)',
    source_verification: 'Government of Japan (JICA) & Arab Republic of Egypt Agreement',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-ejust-robotics', faculty_id: 'fac-ejust-eng', name_ar: 'هندسة الميكاترونيات والروبوتات والأنظمة الذاتية (النظام الياباني)', name_en: 'Mechatronics & Robotics Engineering (Japanese Model)', degree_ar: 'بكالوريوس', degree_en: 'B.Sc. (E-JUST / Japan Model)', program_type: 'joint_international', program_type_ar: 'برنامج مصري ياباني معتمد بالشراكة مع الجامعات اليابانية', study_system_ar: 'ساعات معتمدة بحثية يابانية', is_available: true }
    ]
  },
  {
    id: 'fac-zewail-sci',
    university_id: 'uni-zewail',
    governorate_ar: 'الجيزة',
    governorate_en: 'Giza',
    name_ar: 'جامعة العلوم والتكنولوجيا بمدينة زويل (Zewail City of Science & Technology)',
    name_en: 'University of Science & Technology at Zewail City',
    sector: 'engineering',
    sector_ar: 'قطاع المعاهد والجامعات القومية البحثية ذات الطبيعة الخاصة',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الهندسة الطبية الحيوية والنانوتكنولوجي وهندسة الطيران والعلوم الطبية الحيوية وفيزياء الأرض والكون',
    specialization_en: 'Biomedical, Nanotech, Aerospace, Biomedical Sciences & Earth Physics (ABET)',
    source_verification: 'ABET Accredited & Presidential Law 161 of 2012',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-zewail-nano', faculty_id: 'fac-zewail-sci', name_ar: 'هندسة تكنولوجيا النانو والإلكترونيات المتقدمة (معتمد من ABET)', name_en: 'Nanotechnology & Nanoelectronics Engineering (ABET)', degree_ar: 'بكالوريوس', degree_en: 'B.Sc (ABET Accredited)', program_type: 'distinguished', program_type_ar: 'برنامج بحثي قومي معتمد دولياً', study_system_ar: 'ساعات معتمدة أمريكية ABET', is_available: true },
      { id: 'sp-zewail-bms', faculty_id: 'fac-zewail-sci', name_ar: 'العلوم الطبية الحيوية المتقدمة (Biomedical Sciences - BMS)', name_en: 'Biomedical Sciences Program (BMS)', degree_ar: 'بكالوريوس', degree_en: 'B.Sc (Biomedical)', program_type: 'distinguished', program_type_ar: 'برنامج طبي حيوي بحثي رائد', study_system_ar: 'ساعات معتمدة', is_available: true }
    ]
  },
  {
    id: 'fac-aastmt-maritime',
    university_id: 'uni-aastmt',
    governorate_ar: 'الإسكندرية',
    governorate_en: 'Alexandria',
    name_ar: 'كلية النقل البحري والتكنولوجيا بالأكاديمية العربية (AASTMT أبي قير)',
    name_en: 'College of Maritime Transport & Technology (AASTMT Abu Qir)',
    sector: 'engineering',
    sector_ar: 'قطاع الأكاديميات والمنظمات العربية الدولية (جامعة الدول العربية)',
    accreditation_status: 'accredited',
    is_accredited: true,
    is_active: true,
    specialization_ar: 'الملاحة البحرية وضباط الملاحة والهندسة البحرية وإدارة النقل الدولي واللوجستيات',
    specialization_en: 'Nautical Technology, Marine Engineering & Maritime Transport',
    source_verification: 'International Maritime Organization (IMO) & League of Arab States',
    last_verified_at: '2026-11-01',
    specializations: [
      { id: 'sp-aastmt-marine-nav', faculty_id: 'fac-aastmt-maritime', name_ar: 'تكنولوجيا الملاحة البحرية وشهادة ضابط ثان ملاحة (IMO المعتمدة دولياً)', name_en: 'Nautical Technology & 2nd Mate Certificate of Competency', degree_ar: 'بكالوريوس وشهادة كفاءة بحرية', degree_en: 'B.Sc. & IMO License', program_type: 'joint_international', program_type_ar: 'شهادة ملاحة دولية معتمدة من المنظمة البحرية الدولية IMO', study_system_ar: 'ساعات معتمدة مع تدريب بحري عملي على السفن', is_available: true }
    ]
  }
];
