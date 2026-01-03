import { PrismaClient, TransitionTypeEnum } from '@prisma/client';

// Static data extracted from CSV files
const auditElements = [
  {
    code: '1',
    name: 'Development and Maintenance of Commitments',
    description: 'Pembangunan dan Pemeliharaan Komitmen',
  },
  {
    code: '2',
    name: 'Preparation and Documentation of OHS Plan',
    description: 'Pembuatan dan Pendokumentasian Rencana K3',
  },
  {
    code: '3',
    name: 'Design Control and Contract Review',
    description: 'Pengendalian Perancangan dan Peninjauan Kontrak',
  },
  {
    code: '4',
    name: 'Document Control',
    description: 'Pengendalian Dokumen',
  },
  {
    code: '5',
    name: 'Purchase and Product Control',
    description: 'Pembelian dan Pengendalian Produk',
  },
  {
    code: '6',
    name: 'Safety Works Based on OHSMS',
    description: 'Keamanan Bekerja Berdasarkan SMK3',
  },
  {
    code: '7',
    name: 'Monitoring Standard',
    description: 'Standar Pemantauan',
  },
  {
    code: '8',
    name: 'Reporting and Fixing Weaknesses',
    description: 'Pelaporan dan Perbaikan Kekurangan',
  },
  {
    code: '9',
    name: 'Material Management and Movements',
    description: 'Pengelolaan Material dan Perpindahannya',
  },
  {
    code: '10',
    name: 'Data Collection and Use',
    description: 'Pengumpulan dan Penggunaan Data',
  },
  {
    code: '11',
    name: 'OHS Management System Assessment',
    description: 'Pemeriksaan SMK3',
  },
  {
    code: '12',
    name: 'Skills and Abilities Development',
    description: 'Pengembangan Keterampilan dan Kemampuan',
  },
];

const auditClauses = [
  // Element 1
  { code: '1.1', elementCode: '1', name: 'Occupational Safety and Health Policy Clauses', description: 'Klausul Kebijakan Keselamatan dan Kesehatan Kerja', order: 1 },
  { code: '1.2', elementCode: '1', name: 'Responsibility and Authority to Act', description: 'Tanggung Jawab dan Wewenang Untuk Bertindak', order: 2 },
  { code: '1.3', elementCode: '1', name: 'Review and Evaluation', description: 'Tinjauan dan Evaluasi', order: 3 },
  { code: '1.4', elementCode: '1', name: 'Involvement and Consultation with Workers', description: 'Keterlibatan dan Konsultasi dengan Tenaga Kerja', order: 4 },
  // Element 2
  { code: '2.1', elementCode: '2', name: 'OHS Strategic Plan', description: 'Rencana Srategi K3', order: 1 },
  { code: '2.2', elementCode: '2', name: 'OHS Management System Manual', description: 'Manual SMK3', order: 2 },
  { code: '2.3', elementCode: '2', name: 'Legislation and other requirements in the field of OHS', description: 'Peraturan perundangan dan persyaratan lain dibidang K3', order: 3 },
  { code: '2.4', elementCode: '2', name: 'Occupational Health and Safety Information', description: 'Informasi K3', order: 4 },
  // Element 3
  { code: '3.1', elementCode: '3', name: 'Design Control', description: 'Pengendalian Perancangan', order: 1 },
  { code: '3.2', elementCode: '3', name: 'Contract Review', description: 'Peninjauan Kontrak', order: 2 },
  // Element 4
  { code: '4.1', elementCode: '4', name: 'Document Control Approval and Expenditure', description: 'Persetujuan dan Pengeluaran Pengendalian Dokumen', order: 1 },
  { code: '4.2', elementCode: '4', name: 'Document Changes and Modifications', description: 'Perubahan dan Modifikasi Dokumen', order: 2 },
  // Element 5
  { code: '5.1', elementCode: '5', name: 'Specification and Purchase of Goods and Services', description: 'Spesifikasi dan Pembelian Barang dan Jasa', order: 1 },
  { code: '5.2', elementCode: '5', name: 'Verification System for Purchased Goods and Services', description: 'Sistem Verivikasi Barang dan Jasa yang Telah dibeli', order: 2 },
  { code: '5.3', elementCode: '5', name: 'Control of Customer-Supplied Goods and Services', description: 'Pengendalian Barang dan Jasa yang Dipasok Pelanggan', order: 3 },
  { code: '5.4', elementCode: '5', name: 'Product Traceability', description: 'Kemampuan Telusur Produk', order: 4 },
  // Element 6
  { code: '6.1', elementCode: '6', name: 'Work System', description: 'Sistem Kerja', order: 1 },
  { code: '6.2', elementCode: '6', name: 'Supervision', description: 'Pengawasan', order: 2 },
  { code: '6.3', elementCode: '6', name: 'Selection and Placement of Personnel', description: 'Seleksi dan Penempatan Personil', order: 3 },
  { code: '6.4', elementCode: '6', name: 'Restricted Area', description: 'Area Terbatas', order: 4 },
  { code: '6.5', elementCode: '6', name: 'Maintenance, Repair and Change of Production Facilities', description: 'Pemeliharaan, Perbaikan dan Perubahan Sarana Produksi', order: 5 },
  { code: '6.6', elementCode: '6', name: 'Service', description: 'Pelayanan', order: 6 },
  { code: '6.7', elementCode: '6', name: 'Preparedness to Handle Emergencies', description: 'Kesiapan untuk Menangani Keadaan Darurat', order: 7 },
  { code: '6.8', elementCode: '6', name: 'First Aid In Accident', description: 'Pertolongan Pertama Pada Kecelakaan', order: 8 },
  { code: '6.9', elementCode: '6', name: 'Emergency Planning and Recovery', description: 'Rencana dan Pemulihan Keadaan Darurat', order: 9 },
  // Element 7
  { code: '7.1', elementCode: '7', name: 'Hazard Assessment', description: 'Pemeriksaan Bahaya', order: 1 },
  { code: '7.2', elementCode: '7', name: 'Monitoring / Measurement of Work Environment', description: 'Pemantauan / Pengukuran Lingkungan Kerja', order: 2 },
  { code: '7.3', elementCode: '7', name: 'Inspection, Measurement and Testing Equipment', description: 'Peralatan Pemeriksaan / Inspeksi, Pengukuran dan Pengujian', order: 3 },
  { code: '7.4', elementCode: '7', name: 'Workforce Health Monitoring', description: 'Pemantauan Kesehatan Tenaga Kerja', order: 4 },
  // Element 8
  { code: '8.1', elementCode: '8', name: 'Hazard Reporting', description: 'Pelaporan Bahaya', order: 1 },
  { code: '8.2', elementCode: '8', name: 'Accident Report', description: 'Pelaporan Kcelakaan', order: 2 },
  { code: '8.3', elementCode: '8', name: 'Accident Inspection and Assessment', description: 'Pemeriksaan dan Pengkajian Kecelakaan', order: 3 },
  { code: '8.4', elementCode: '8', name: 'Troubleshooting', description: 'Penanganan Masalah', order: 4 },
  // Element 9
  { code: '9.1', elementCode: '9', name: 'Manual and Mechanical Handling', description: 'Penanganan Secara Manual dan Mekanis', order: 1 },
  { code: '9.2', elementCode: '9', name: 'Transport, Storage and Construction Systems', description: 'Sistem Pengangkutan, Penyimpanan dan Pembangunan', order: 2 },
  { code: '9.3', elementCode: '9', name: 'Control of Hazardous Chemicals', description: 'Pengendalian Bahan Kimia Berbahaya (BKB)', order: 3 },
  // Element 10
  { code: '10.1', elementCode: '10', name: 'OSH records', description: 'Catatan K3', order: 1 },
  { code: '10.2', elementCode: '10', name: 'OHS Data and Report', description: 'Data dan Laporan K3', order: 2 },
  // Element 11
  { code: '11.1', elementCode: '11', name: 'Internal Audit SMK3', description: 'Audit Internal SMK3', order: 1 },
  // Element 12
  { code: '12.1', elementCode: '12', name: 'Training Strategy', description: 'Strategi Pelatihan', order: 1 },
  { code: '12.2', elementCode: '12', name: 'Training for Management and Supervisor', description: 'Pelatihan bagi Manajemen dan Penyelia', order: 2 },
  { code: '12.3', elementCode: '12', name: 'Training for Workers', description: 'Pelatihan Bagi Tenaga Kerja', order: 3 },
  { code: '12.4', elementCode: '12', name: 'Induction Training and Training for Visitors and Contractors', description: 'Pelatihan Pengenalan dan Pelatihan untuk Pengunjung dan Kontraktor', order: 4 },
  { code: '12.5', elementCode: '12', name: 'Special Skills Training', description: 'Pelatihan Keahlian Khusus', order: 5 },
];

const auditCriteria = [
  // Clause 1.1
  { code: '1.1.1', clauseCode: '1.1', name: 'There is a written occupational health and safety policy, dated and signed by the employer or manager, clearly stating the objectives and targets of OHS as well as the commitment to improving OHS.', description: 'Terdapat kebijakan K3 yang tertulis, bertanggal, ditandatangani oleh pengusaha atau pengurus,secara jelas menyatakan tujuan dan sasaran K3 serta komitmen terhadap peningkatan K3', order: 1 },
  { code: '1.1.2', clauseCode: '1.1', name: 'The policy is formulated by the employer and/or management after consulting with representatives of the workforce.', description: 'Kebijakan  disusun oleh pengusaha dan / atau pengurus setelah melalui proses konsultasi dengan wakil tenaga kerja', order: 2 },
  { code: '1.1.3', clauseCode: '1.1', name: 'The company communicates its OHS policy to all workers, guests, contractors, customers and suppliers in the right manner. The company communicates the occupational health and safety policy to all employees, visitors, contractors, customers, and suppliers using appropriate procedures.', description: 'Perusahaan mengkomunikasikan kebijakan K3 kepada seluruh tenaga kerja,tamu,kontraktor,pelanggan dan pemasok dengan tata cara yang tepat', order: 3 },
  { code: '1.1.4', clauseCode: '1.1', name: 'Special policies are made for specific OHS issues', description: 'Kebijakan khusus dibuat untuk masalah K3 yang bersifat khusus', order: 4 },
  { code: '1.1.5', clauseCode: '1.1', name: 'The OSH policy and other specific policies are reviewed periodically to ensure that these policies are in accordance with changes that occur within the company and in the laws and regulations', description: 'Kebijakan K3 dan kebijakan khusus lainnya ditinjau ulang secara berkala untuk menjamin bahwa kebijakan tersebut sesuai dengan perubahan yang terjadi dalam perusahaan dan dalam peraturan perundang-undangan', order: 5 },
  // Clause 1.2
  { code: '1.2.1', clauseCode: '1.2', name: 'The responsibility and authority to take action and report to all relevant personnel within the company that has been established must be disseminated and documented.', description: 'Tanggung jawab dan wewenang untuk mengambil tindakan dan melaporkan kepada semua personil yang terkait dalam perusahaan yang telah ditetapkan harus disebarluaskan dan didokumentasikan', order: 1 },
  { code: '1.2.2', clauseCode: '1.2', name: 'The appointment of the occupational health and safety responsible person must comply with applicable regulations.', description: 'Penunjukan penanggung jawab K3 harus sesuai peraturan perundangan yang berlaku', order: 2 },
  { code: '1.2.3', clauseCode: '1.2', name: 'The unit leaders in a company are responsible for the occupational health and safety performance within their respective units.', description: 'Pemimpin unit kerja dalam suatu perusahaan bertanggung jawab atas kinerja K3 pada unit kerjanya', order: 3 },
  { code: '1.2.4', clauseCode: '1.2', name: 'The employer or management is fully responsible for ensuring the implementation of the SMK3 (Occupational Health and Safety Management System).', description: 'Pengusaha atau pengurus bertanggung Jawab secara penuh untuk menjamin pelaksanaan SMK3', order: 4 },
  { code: '1.2.5', clauseCode: '1.2', name: 'Officers responsible for handling emergencies have been assigned and trained', description: 'Petugas yang bertanggung jawab untuk menangani keadaan darurat  telah ditetapkan dan mendapat pelatihan', order: 5 },
  { code: '1.2.6', clauseCode: '1.2', name: 'The company receives advice from occupational health and safety experts from within and/or outside the company.', description: 'Perusahaan mendapatkan saran-saran dari para ahli dibidang K3 yang berasal dari dalam dan / atau luar Perusahaan', order: 6 },
  { code: '1.2.7', clauseCode: '1.2', name: 'The performance of OHS is included in the company\'s annual report or other equivalent reports.', description: 'Kinerja K3 termuat dalam laporan tahunan perusahaan atau laporan lain yang setingkat', order: 7 },
  // Clause 1.3
  { code: '1.3.1', clauseCode: '1.3', name: 'A review of the implementation of the Occupational Health and Safety management system including policies, planning, implementation, monitoring and evaluation has been conducted, recorded, and documented.', description: 'Tinjauan terhadap penerapan SMK3 meliputi kebijakan, perencanaan, pelaksanaan, pemantauan dan evaluasi telah dilakukan dicatat dan didokumentasikan', order: 1 },
  { code: '1.3.2', clauseCode: '1.3', name: 'The review results are incorporated into the management action planning.', description: 'Hasil tinjauan dimaksukkan dalam perencanaan tindakan manajemen', order: 2 },
  { code: '1.3.3', clauseCode: '1.3', name: 'Management must periodically review the implementation of OHSMS to assess its suitability and effectiveness.', description: 'Pengurus harus meninjau ulang pelaksanaan SMK3 secara berkala untuk menilai kesesuaian dan efektivitas SMK3', order: 3 },
  // Clause 1.4
  { code: '1.4.1', clauseCode: '1.4', name: 'The involvement of workers and scheduling consultations with appointed company representatives are documented and disseminated to all employees.', description: 'Keterlibatan tenaga kerja dan penjadwalan konsultasi dengan wakil perusahaan yang ditunjuk didokumentasikan dan disebarluaskan keseluruh tenaga kerja', order: 1 },
  { code: '1.4.2', clauseCode: '1.4', name: 'There is a procedure in place to facilitate consultation regarding changes that have implications for OHS.', description: 'Terdapat prosedur yang memudahkan konsultasi mengenai perubahan perubahan yang mempunyai implikasi terhadap  K3', order: 2 },
  { code: '1.4.3', clauseCode: '1.4', name: 'The company has established a Occupational Health and Safety Committee (P2K3) in accordance with the regulations.', description: 'Perusahaan telah membentuk P2K3 sesuai dengan peraturan perundang-undangan', order: 3 },
  { code: '1.4.4', clauseCode: '1.4', name: 'The chairperson of the  Occupational Health & Safety Committee is the top leader or management', description: 'Ketua P2K3 adalah pimpinan puncak atau pengurus', order: 4 },
  { code: '1.4.5', clauseCode: '1.4', name: 'The secretary of the P2K3 is an Occupational Health and Safety expert in accordance with the regulations.', description: 'Sekretaris P2K3 adalah ahli K3 sesuai dengan peraturan perundangan', order: 5 },
  { code: '1.4.6', clauseCode: '1.4', name: 'The Safety Committee focuses on activities related to the development of policies and procedures to control risks.', description: 'P2K3 menitikberatkan kegiatan pada pengembangan kebijakan dan prosedur untuk mengendalikan risiko', order: 6 },
  { code: '1.4.7', clauseCode: '1.4', name: 'The composition of the Heatlh and Safety Committee management is documented and communicated to the employees.', description: 'Susunan pengurus P2K3 didokumentasikan dan diinformasikan kepada tenaga kerja', order: 7 },
  { code: '1.4.8', clauseCode: '1.4', name: 'The Safety Committee holds regular meetings, and the results are disseminated in the workplace.', description: 'P2K3 mengadakan pertemuan secara teratur dan hasilnya disebarluaskan ditempat kerja.', order: 8 },
  { code: '1.4.9', clauseCode: '1.4', name: 'The Safety Committee regularly reports its activities in accordance with regulations.', description: 'P2K3 melaporkan kegiatannya secara teratur sesuai dengan peraturan perundang-undangan', order: 9 },
  { code: '1.4.10', clauseCode: '1.4', name: 'Working groups are formed and selected from representatives of the workforce appointed as OHS responsible persons in their workplaces, and they are provided with training in accordance with regulations.', description: 'Dibentuk kelompok-kelompok kerja  dan dipilih dari wakil-wakil tenaga kerja yang ditunjuk sebagai penanggung jawab K3 ditempat kerjanya dan kepadanya diberikan pelatihan sesuai dengan peraturan perundang-undangan.', order: 10 },
  { code: '1.4.11', clauseCode: '1.4', name: 'The composition of the established working groups is documented and communicated to the workforce.', description: 'Susunan kelompok-kelompok kerja yang telah terbentuk didokumentasikan dan  diinformasikan kepada tenaga kerja', order: 11 },
  // Clause 2.1
  { code: '2.1.1', clauseCode: '2.1', name: 'There are documented procedures for the identification of potential hazards, assessment, and control of OHS risks.', description: 'Terdapat prosedur terdokumentasi untuk identifikasi potensi bahaya, penilaian, dan pengendalian risiko K3', order: 1 },
  { code: '2.1.2', clauseCode: '2.1', name: 'Identifikasi potensi bahaya, penilaian dan pengendalian risiko K3 sebagai rencana strategi K3 dilakukan oleh petugas yang berkompeten', description: 'Identifikasi potensi bahaya, penilaian dan pengendalian risiko K3 sebagai rencana strategi K3 dilakukan oleh petugas yang berkompeten', order: 2 },
  { code: '2.1.3', clauseCode: '2.1', name: 'The occupational health and safety strategy plan is based at least on an initial review, identification of potential hazards, risk assessment, risk control, and regulations as well as other occupational health and safety information both from within and outside the company.', description: 'Rencana strategi K3  sekurang-kurangnya berdasarkan tinjauan awal,idenfitikasi potensi bahaya, penilaian, pengendalian  risiko dan peraturan perundang undangan serta informasi K3 lain baik dari dalam maupun luar Perusahaan.', order: 3 },
  { code: '2.1.4', clauseCode: '2.1', name: 'The established occupational health and safety strategy plan is used to control OHS risks by setting measurable objectives and targets, prioritizing them, and providing resources.', description: 'Rencana strategi K3 yang telah Ditetapkan digunakan untuk  mengendalikan risiko K3 dengan  menetapkan tujuan dan sasaran yang dapat diukur dan menjadi prioritas serta  menyediakan sumber daya', order: 4 },
  { code: '2.1.5', clauseCode: '2.1', name: 'Work plans and specific plans related to products, processes, projects, or specific workplaces have been created by setting measurable objectives and targets, establishing achievement timelines, and providing resources.', description: 'Rencana kerja dan rencana khusus yang  berkaitan dengan produk,proses, proyek  atau tempat kerja tertentu telah dibuat  dengan menetapkan tujuan dan sasaran  yang dapat diukur, menetapkan waktu  pencapaian dan menyediakan sumber daya', order: 5 },
  { code: '2.1.6', clauseCode: '2.1', name: 'OHS plan is aligned with company management system plan', description: 'Rencana K3 diselaraskan dengan rencana sistem manajemen perusahaan', order: 6 },
  // Clause 2.2
  { code: '2.2.1', clauseCode: '2.2', name: 'The OHSMS manual covers OSH policies, objectives, plans and procedures and defines OSH responsibilities for all levels within the company.', description: 'Manual SMK3 meliputi kebijakan, tujuan, rencana, dan prosedur K3 serta menentukan tanggung jawab K3 untuk semua tingkatan dalam perusahaan.', order: 1 },
  { code: '2.2.2', clauseCode: '2.2', name: 'There are specific manuals relating to a particular product, process or workplace', description: 'Terdapat manual khusus yang berkaitan dengan produk,proses,atau tempat kerja tertentu', order: 2 },
  { code: '2.2.3', clauseCode: '2.2', name: 'The OHSMS manual is easily accessible by all personnel in the company as needed', description: 'Manual SMK3 mudah didapat oleh semua personil dalam perusahaan sesuai kebutuhan', order: 3 },
  // Clause 2.3
  { code: '2.3.1', clauseCode: '2.3', name: 'There are documented procedures to identify, obtain, maintain and understand laws and regulations, standards, technical guidelines, and other relevant requirements in the field of OHS for all employees in the Company.', description: 'Terdapat prosedur yang terdokumentasi untuk mengidentifikasi,memperoleh, memelihara dan memahami peraturan perundang-undangan, standar, pedoman teknis, dan persyaratan lain yang relevan dibidang K3 untuk seluruh tenaga kerja di Perusahaan', order: 1 },
  { code: '2.3.2', clauseCode: '2.3', name: 'Responsible for maintaining and distributing the latest information regarding laws and regulations, standards, technical guidelines, and other requirements has been established', description: 'Penanggung jawab untuk memelihara dan mendistribusikan informasi terbaru mengenai peraturan perundangan, standar, pedoman teknis, dan persyaratan lain telah ditetapkan', order: 2 },
  { code: '2.3.3', clauseCode: '2.3', name: 'Personnel who are appointed and given responsibility for maintaining and distributing every latest OHS information to reach every workforce who needs it (assignment orders, decrees, list of types of OHS information, evidence of distribution of the latest information.', description: 'Persyaratan pada peraturan perundang undangan, standar,pedoman teknis, dan persyaratan lain yang relevan di bidang K3 dimasukkan pada prosedur-prosedur dan petunjuk-petunjuk kerja', order: 3 },
  { code: '2.3.4', clauseCode: '2.3', name: 'Changes to laws and regulations, standards, technical guidelines, and other relevant requirements in the field of OHS, are used for reviewing work procedures and instructions', description: 'Perubahan pada peraturan perundang undangan, standar, pedoman teknis, dan persyaratan lain yang relevan dibidang K3, digunakan untuk peninjauan prosedur-prosedur dan petunjuk-petunjuk kerja', order: 4 },
  // Clause 2.4
  { code: '2.4.1', clauseCode: '2.4', name: 'The required information regarding OHS activities is disseminated systematically to all employees, guests, contractors, customers and suppliers', description: 'Informasi yang dibutuhkan mengenai kegiatan K3 disebarluaskan secara sistimatis kepada seluruh tenaga kerja, tamu, kontraktor, pelanggan dan pemasok', order: 1 },
  // Clause 3.1
  { code: '3.1.1', clauseCode: '3.1', name: 'Documented procedures considering potential hazard identification, assessment, and risk control are carried out at the Design and modification stages.', description: 'Prosedur yang terdokumentasi mempertimbangkan identifikasi potensi bahaya, penilaian, dan pengendalian risiko yang dilakukan pada tahap Perancangan dan modifikasi.', order: 1 },
  { code: '3.1.2', clauseCode: '3.1', name: 'Procedures and work instructions in the use of products, operation of machines and equipment, installations, aircraft or processes as well as other information related to OHS have been developed during the design and/or modification', description: 'Prosedur dan instruksi kerja dalam penggunaan produk, pengoperasian mesin dan peralatan , istalasi,pesawat atau proses serta informasi lainnya yang berkaitan dengan K3 telah dikembangkan selama perancangan  dan / atau modifikasi', order: 2 },
  { code: '3.1.3', clauseCode: '3.1', name: 'Competent personnel verify that the design and/or modification meets the established OHS requirements prior to use of the design.', description: 'Petugas yang kompeten  melakukan verifikasi bahwa perancangan dan / atau modifikasi memenuhi persyaratan K3 yang di tetapkan sebelum penggunaan hasil rancangan.', order: 3 },
  { code: '3.1.4', clauseCode: '3.1', name: 'All design changes and modifications that have implications for OHS are identified, documented, reviewed and approved by authorized personnel prior to implementation.', description: 'Semua perubahan dan modifikasi perancangan yang mempunyai implikasi terhadap K3 diidentifikasikan, didokumentasikan, ditinjau ulang dan disetujui oleh petugas yang berwenang sebelum pelaksanaan.', order: 4 },
  // Clause 3.2
  { code: '3.2.1', clauseCode: '3.2', name: 'Documented procedures must be able to identify and assess potential OHS hazards, the environment and society, where these procedures are used when supplying goods and services in a contract.', description: 'Prosedur yang terdokumentasi harus mampu mengidentifikasi dan menilai potensi bahaya K3, lingkungan dan masyarakat, dimana prosedur tersebut digunakan pada saat memasok barang dan jasa dalam suatu kontrak.', order: 1 },
  { code: '3.2.2', clauseCode: '3.2', name: 'Hazard identification and risk assessment is carried out on contract review by a competent person.', description: 'Identifikasi bahaya dan penilaian risiko dilakukan pada tinjauan kontrak oleh petugas yang berkompeten.', order: 2 },
  { code: '3.2.3', clauseCode: '3.2', name: 'Contracts are reviewed to ensure that suppliers can meet OHS requirements for customers', description: 'Kontrak ditinjau ulang untuk menjamin bahwa pemasok dapat memenuhi persyaratan K3 bagi pelanggan', order: 3 },
  { code: '3.2.4', clauseCode: '3.2', name: 'Contract review records are maintained and documented', description: 'Catatan tinjauan kontrak dipelihara dan didokumentasikan', order: 4 },
  // Clause 4.1
  { code: '4.1.1', clauseCode: '4.1', name: 'OHS document has identification of status, authority, date of issue and date of modification', description: 'Dokumen K3 mempunyai identifikasi status, wewenang, tanggal pengeluaran dan tanggal modifikasi', order: 1 },
  { code: '4.1.2', clauseCode: '4.1', name: 'The recipient of the distribution document is listed in the document.', description: 'Penerima distribusi dokumen tercantum dalam dokumen tersebut.', order: 2 },
  { code: '4.1.3', clauseCode: '4.1', name: 'The latest edition of OHS documents are stored in a systematic manner in the designated places', description: 'Dokumen K3 edisi terbaru disimpan Secara sistematis pada tempat yang ditentukan', order: 3 },
  { code: '4.1.4', clauseCode: '4.1', name: 'Obsolete documents are immediately removed from use, while obsolete documents stored for certain purposes are marked with a special mark', description: 'Dokumen usang segera disingkirkan dari penggunaannya sedangkan dokumen usang yang disimpan untuk keperluan tertentu diberi tanda khusus', order: 4 },
  // Clause 4.2
  { code: '4.2.1', clauseCode: '4.2', name: 'There is a system for making, approving changes to OHS documents.', description: 'Terdapat sistem untuk membuat, menyetujui perubahan terhadap dokumen K3.', order: 1 },
  { code: '4.2.2', clauseCode: '4.2', name: 'In the event of a change, the reason for the change is given and stated in the document or attachment and informs the relevant parties.', description: 'Dalam hal terjadi perubahan diberikan alasan terjadinya perubahan dan tertera dalam dokumen atau lampirannya dan menginformasikan kepada pihak terkait.', order: 2 },
  { code: '4.2.3', clauseCode: '4.2', name: 'There is a document control procedure or a list of all documents that lists the status of each of these documents in an effort to prevent the use of obsolete documents.', description: 'Terdapat prosedur pengendalian dokumen atau daftar seluruh dokumen yang mencantumkan status dari setiap dokumen tersebut dalam upaya mencegah penggunaan dokumen usang.', order: 3 },
  // Clause 5.1
  { code: '5.1.1', clauseCode: '5.1', name: 'There is a documented procedure in place to ensure that technical specifications and other information relevant to OSH have been checked prior to a purchase decision.', description: 'Terdapat prosedur yang terdokumentasi yang dapat menjamin spesifikasi teknik dan informasi lainnya yang relevan dengan K3 telah diperiksa sebelum keputusan untuk membeli.', order: 1 },
  { code: '5.1.2', clauseCode: '5.1', name: 'Purchase specifications for each production facility, chemical substance or service must be accompanied by specifications that comply with statutory requirements and OHS standards.', description: 'Spesifikasi pembelian untuk setiap sarana produksi, zat kimia atau jasa harus dilengkapi spesifikasi yang sesuai dengan persyaratan peraturan perundangan dan standar K3 .', order: 2 },
  { code: '5.1.3', clauseCode: '5.1', name: 'Consultation with a competent workforce at the time of the purchase decision is carried out to determine the OHS requirements that are included in the purchase specification and informed to the workers who use it.', description: 'Konsultasi dengan tenaga kerja yang kompeten pada saat keputusan membeli, dilakukan untuk menetapkan persyaratan K3 yang dicantumkan dalam spesifikasi pembelian dan diinformasikan kepada tenaga kerja yang menggunakannya.', order: 3 },
  { code: '5.1.4', clauseCode: '5.1', name: 'Training needs, supply of personal protective equipment, and changes to work procedures should be considered prior to purchase and use.', description: 'Kebutuhan pelatihan, pasokan alat  pelindung diri, dan perubahan terhadap prosedur kerja harus dipertimbangkan sebelum pembelian dan penggunaannya.', order: 4 },
  { code: '5.1.5', clauseCode: '5.1', name: 'OHS requirements are evaluated and taken into consideration in the purchase selection.', description: 'Persyaratan K3 dievaluasi dan menjadi pertimbangan dalam seleksi pembelian.', order: 5 },
  // Clause 5.2
  { code: '5.2.1', clauseCode: '5.2', name: 'Purchased goods and services are checked for conformance with purchase specifications.', description: 'Barang dan jasa yang telah dibeli diperiksa kesesuaiannya dengan spesifikasi pembelian.', order: 1 },
  // Clause 5.3
  { code: '5.3.1', clauseCode: '5.3', name: 'Goods and services supplied by customers, before being used, the potential hazards are identified and the risks are assessed. Records are maintained to check this procedure', description: 'Barang dan jasa yang dipasok pelanggan, sebelum digunakan terlebih dahulu diidentifikasi potensi bahaya dan dinilai risikonya. Catatan tersebut dipelihara untuk memeriksa prosedur ini', order: 1 },
  // Clause 5.4
  { code: '5.4.1', clauseCode: '5.4', name: 'All products used in the production process can be identified at all stages of production and installation, if there are potential OHS problems', description: 'Semua produk yang digunakan dalam Proses produksi dapat diidentifikasi di seluruh tahapan produksi dan instalasi,  jika terdapat potensi masalah K3', order: 1 },
  { code: '5.4.2', clauseCode: '5.4', name: 'There is a documented procedure for tracing products that have been sold, if there are potential OHS problems in their use.', description: 'Terdapat prosedur yang terdokumentasi Untuk penelusuran produk yang telah terjual, jika terdapat potensi masalah K3 didalam penggunaannya.', order: 2 },
  // Clause 6.1
  { code: '6.1.1', clauseCode: '6.1', name: 'Competent officers have identified hazards, assessed and controlled risks arising from a work process.', description: 'Petugas yang kompeten telah mengidentifikasikan bahaya, menilai dan mengendalikan risiko yang timbul dari suatu proses kerja.', order: 1 },
  { code: '6.1.2', clauseCode: '6.1', name: 'If risk control efforts are needed, these efforts are determined through the level of control.', description: 'Apabila upaya pengendalian risiko diperlukan maka upaya tersebut ditetapkan melalui tingkat pengendalian.', order: 2 },
  { code: '6.1.3', clauseCode: '6.1', name: 'There are documented procedures or work instructions to control identified risks and are made on the basis of input from competent personnel and workforce', description: 'Terdapat prosedur atau petunjuk kerja yang terdokumentasikan untuk mengendalikan risiko yang teridentifikasi dan dibuat atas dasar masukan  dari  personil yang kompeten serta tenaga kerja', order: 3 },
  { code: '6.1.4', clauseCode: '6.1', name: 'Compliance with laws and regulations, standards and relevant technical guidelines is observed when developing or modifying work instructions.', description: 'Kepatuhan terhadap peraturan perundang-undangan, standar serta pedoman teknis yang relevan diperhatikan pada saat mengembangkan atau melakukan modifikasi terhadap petunjuk kerja.', order: 4 },
  { code: '6.1.5', clauseCode: '6.1', name: 'There is a work permit system for high-risk tasks', description: 'Terdapat sistem izin kerja untuk tugas Berisiko tinggi', order: 5 },
  { code: '6.1.6', clauseCode: '6.1', name: 'Personal protective equipment is provided as needed and used correctly and always maintained in a usable condition', description: 'Alat pelindung diri  disediakan sesuai kebutuhan dan digunakan secara benar serta selalu dipelihara dalam kondisi layak pakai', order: 6 },
  { code: '6.1.7', clauseCode: '6.1', name: 'The personal protective equipment used is ensured that it is suitable for use in accordance with applicable standards and/or laws and regulations.', description: 'Alat pelindung diri yang digunakan dipastikan telah laik pakai sesuai dengan standar dan atau peraturan perundangan yang berlaku.', order: 7 },
  { code: '6.1.8', clauseCode: '6.1', name: 'Risk control efforts are evaluated periodically if there is a discrepancy or change in the work process.', description: 'Upaya pengendalian risiko dievaluasi secara berkala apabila terjadi ketidaksesuaian atau perubahan pada proses kerja.', order: 8 },
  // Clause 6.2
  { code: '6.2.1', clauseCode: '6.2', name: 'Supervision is carried out to ensure that every work is carried out safely and follows the procedures and work instructions that have been determined', description: 'Dilakukan pengawasan untuk menjamin bahwa setiap pekerjaan dilaksanakan dengan aman dan mengikuti prosedur dan petunjuk kerja yang telah ditentukan', order: 1 },
  { code: '6.2.2', clauseCode: '6.2', name: 'Everyone is supervised according to their level of ability and the level of risk of the task', description: 'Setiap orang diawasi sesuai dengan tingkat kemampuan mereka dan tingkat risiko tugas', order: 2 },
  { code: '6.2.3', clauseCode: '6.2', name: 'Supervisor/superior participates in hazard identification and makes control measures.', description: 'Pengawas / penyelia ikut serta dalam identifikasi bahaya dan membuat upaya  pengendalian.', order: 3 },
  { code: '6.2.4', clauseCode: '6.2', name: 'Supervisors/superior are involved in conducting investigations and making reports on the occurrence of accidents and occupational diseases and are required to submit reports and suggestions to the management.', description: 'Pengawas / penyelia diikutsertakan dalam melakukan penyelidikan dan pembuatan laporan terhadap terjadinya kecelakaan dan penyakit akibat kerja serta wajib menyerahkan laporan dan saran-saran  kepada pengusaha atau pengurus.', order: 4 },
  { code: '6.2.5', clauseCode: '6.2', name: 'Supervisor/superior participate in the consultation process.', description: 'Pengawas/ penyelia ikut serta dalam proses konsultasi.', order: 5 },
  // Clause 6.3
  { code: '6.3.1', clauseCode: '6.3', name: 'Specific job requirements, including health requirements are identified and used for the selection and placement of workers.', description: 'Persyaratan tugas tertentu, termasuk persyaratan kesehatan diidentifikasi dan dipakai untuk menyeleksi dan penempatan tenaga kerja.', order: 1 },
  { code: '6.3.2', clauseCode: '6.3', name: 'Job assignments must be based on the abilities and skills possessed', description: 'Penugasan pekerjaan harus berdasarkan kemampuan dan ketrampilan yang dimiliki', order: 2 },
  // Clause 6.4
  { code: '6.4.1', clauseCode: '6.4', name: 'Employers or administrators conduct a risk assessment of the work environment to identify areas that require restrictions on entry permits.', description: 'Pengusaha atau pengurus melakukan penilaian risiko lingkungan kerja untuk mengetahui daerah-daerah yang memerlukan pembatasan izin masuk.', order: 1 },
  { code: '6.4.2', clauseCode: '6.4', name: 'There is control over areas / places with restrictions on entry permits', description: 'Terdapat pengendalian atas daerah / tempat-tempat dengan pembatasan ijin masuk', order: 2 },
  { code: '6.4.3', clauseCode: '6.4', name: 'Facilities and services are available in the workplace in accordance with technical standards and guidelines.', description: 'Tersedia fasilitas dan layanan ditempat  kerja sesuai dengan standar dan pedoman teknis.', order: 3 },
  { code: '6.4.4', clauseCode: '6.4', name: 'OHS signs must be installed in accordance with technical standards and guidelines.', description: 'Rambu-rambu K3 harus dipasang sesuai dengan standar dan pedoman teknis.', order: 4 },
  // Clause 6.5
  { code: '6.5.1', clauseCode: '6.5', name: 'Scheduling of inspection and maintenance of production facilities and equipment includes verification of safety equipment and requirements stipulated by laws and regulations, relevant technical standards and guidelines.', description: 'Penjadwalan pemeriksaan dan Pemeliharaan sarana produksi serta peralatan mencakup verifikasi alat alat Pengaman serta persyaratan yang ditetapkan oleh peraturan perundang - undangan,standar dan pedoman teknis yang relevan.', order: 1 },
  { code: '6.5.2', clauseCode: '6.5', name: 'All records containing detailed data on inspection, maintenance, repair and changes made to production facilities must be kept and maintained.', description: 'Semua catatan yang memuat data-data secara rinci dari kegiatan pemeriksaan, pemeliharaan, perbaikan dan perubahan perubahan yang dilakukan atas sarana produksi harus disimpan dan dipelihara.', order: 2 },
  { code: '6.5.3', clauseCode: '6.5', name: 'Production facilities and equipment have valid certificates in accordance with statutory requirements and standards', description: 'Sarana dan peralatan produksi  memiliki sertifikat yang masih berlaku sesuai dengan persyaratan perundang Undangan dan standar', order: 3 },
  { code: '6.5.4', clauseCode: '6.5', name: 'Inspection, maintenance, repair and any changes must be carried out by competent and authorized personnel.', description: 'Pemeriksaan, pemeliharaan, perawatan, Perbaikan dan setiap perubahan harus dilakukan petugas yang kompeten dan berwenang.', order: 4 },
  { code: '6.5.5', clauseCode: '6.5', name: 'There is a procedure to ensure that if there is a change to the production facilities and equipment, the change must be in accordance with the requirements of laws and regulations, relevant technical standards and guidelines.', description: 'Terdapat prosedur untuk menjamin Bahwa jika terjadi perubahan terhadap Sarana dan peralatan produksi, Perubahan tersebut harus sesuai dengan Persyaratan peraturan perundang undangan, standar dan pedoman teknis yang relevan.', order: 5 },
  { code: '6.5.6', clauseCode: '6.5', name: 'There is a procedure for requesting maintenance of production facilities and equipment with OHS conditions that do not meet the requirements and need to be repaired immediately.', description: 'Terdapat prosedur  permintaan pemeliharaan sarana dan peralatan produksi dengan kondisi K3 yang tidak memenuhi persyaratan dan perlu segera Diperbaiki.', order: 6 },
  { code: '6.5.7', clauseCode: '6.5', name: 'There is a system for marking equipment that is no longer safe for use or has not been used.', description: 'Terdapat sistem untuk penandaan bagi Peralatan yang sudah tidak  aman lagi Untuk digunakan atau sudah tidak digunakan.', order: 7 },
  { code: '6.5.8', clauseCode: '6.5', name: 'If necessary, a lock out system is implemented to prevent production facilities from being turned on prematurely.', description: 'Apabila diperlukan, dilakukan penerapan Sistem penguncian pengoperasian (lock out system) untuk mencegah agar sarana produksi tidak dihidupkan sebelum saatnya.', order: 8 },
  { code: '6.5.9', clauseCode: '6.5', name: 'There are procedures that can guarantee the safety and health of workers or other people who are near production facilities and equipment during the inspection, maintenance, repair and alteration process.', description: 'Terdapat prosedur yang dapat menjamin keselamatan dan kesehatan tenaga kerja atau orang lain yang berada didekat sarana dan peralatan produksi pada saat Proses pemeriksaan,pemeliharaan, perbaikan dan perubahan.', order: 9 },
  { code: '6.5.10', clauseCode: '6.5', name: 'There is a person responsible for agreeing that the production facilities and equipment are safe to use after the maintenance, repair or change process.', description: 'Terdapat penanggung jawab untuk menyetujui bahwa sarana dan peralatan produksi telah aman digunakan setelah proses pemeliharaan, perawatan, perbaikan atau perubahan.', order: 10 },
  // Clause 6.6
  { code: '6.6.1', clauseCode: '6.6', name: 'If the company is contracted to provide services that comply with OHS standards and laws and regulations, it is necessary to develop procedures to ensure that the services meet the requirements.', description: 'Apabila perusahaan dikontrak untuk menyediakan pelayanan yang tunduk pada standar dan peraturan perundang-undangan mengenai K3, maka perlu disusun prosedur untuk menjamin bahwa pelayanan memenuhi persyaratan', order: 1 },
  { code: '6.6.2', clauseCode: '6.6', name: 'If the company is provided with services through contracts and the services comply with OHS standards and legislation, it is necessary to develop procedures to ensure that service delivery meets the requirements.', description: 'Apabila perusahaan diberi pelayanan  melalui kontrak dan pelayanan tunduk pada standar dan perundangan K3, maka perlu disusun prosedur untuk menjamin bahwa pemberian pelayanan memenuhi persyaratan.', order: 2 },
  // Clause 6.7
  { code: '6.7.1', clauseCode: '6.7', name: 'Potential emergencies inside or outside the workplace have been identified and emergency procedures documented. and informed so that it is known by all people in the workplace.', description: 'Keadaan darurat yang potensial didalam atau diluar tempat kerja telah diidentifikasi dan prosedur keadaan darurat tersebut telah didokumentasikan. dan diinformasikan agar diketahui oleh seluruh orang yang ada di tempat kerja.', order: 1 },
  { code: '6.7.2', clauseCode: '6.7', name: 'Provision of tools / facilities and procedures for emergencies based on the results of identification and tested and reviewed regularly by competent and authorized officers', description: 'Penyediaan alat / sarana dan prosedur Keadaan darurat berdasarkan hasil identifikasi dan diuji serta di tinjau secara  rutin oleh petugas yang kompeten dan berwenang', order: 2 },
  { code: '6.7.3', clauseCode: '6.7', name: 'Workers receive instructions and training on emergency procedures that are appropriate to the level of risk', description: 'Tenaga kerja mendapat instruksi dan pelatihan mengenai prosedur keadaan darurat yang sesuai dengan tingkat risiko', order: 3 },
  { code: '6.7.4', clauseCode: '6.7', name: 'Emergency handling officers are appointed and given special training and informed to all people in the workplace', description: 'Petugas penanganan keadaan darurat ditetapkan dan diberikan pelatihan khusus serta di informasikan kepada seluruh orang yang ada di tempat kerja', order: 4 },
  { code: '6.7.5', clauseCode: '6.7', name: 'Emergency instructions/procedures and emergency relations are shown clearly and prominently and are known by all employees in the company.', description: 'Instruksi  / prosedur keadaan darurat dan hubungan keadaan darurat diperlihatkan secara jelas dan menyolok serta diketahui oleh seluruh tenaga kerja di perusahaan.', order: 5 },
  { code: '6.7.6', clauseCode: '6.7', name: 'Emergency alarm equipment and systems are provided, checked, tested and maintained on a regular basis in accordance with relevant laws and regulations, technical standards and guidelines.', description: 'Peralatan, dan sistem tanda bahaya  keadaan darurat disediakan, diperiksa, diuji dan dipelihara secara berkala sesuai  dengan peraturan perundang-undangan,  standar dan pedoman teknis yang relevan.', order: 6 },
  { code: '6.7.7', clauseCode: '6.7', name: 'The type, number of placements and the ease of obtaining emergency equipment are in accordance with statutory regulations or standards and are assessed by competent and authorized officers.', description: 'Jenis, jumlah penempatan dan kemudahan untuk mendapatkan alat keadaan darurat telah sesuai dengan peraturan perudang-undangan atau standar dan dinilai oleh petugas yang berkompeten dan berwenang.', order: 7 },
  // Clause 6.8
  { code: '6.8.1', clauseCode: '6.8', name: 'The company has evaluated the first aid kits and ensured that each existing first aid meets the laws and regulations, standards and technical guidelines.', description: 'Perusahaan telah mengevaluasi alat P3K dan menjamin bahwa setiap P3K yang ada memenuhi peraturan perundang-undangan standar dan pedoman teknis.', order: 1 },
  { code: '6.8.2', clauseCode: '6.8', name: 'First aid officers have been trained and appointed in accordance with the laws and regulations.', description: 'Petugas P3K telah dilatih dan ditunjuk sesuai dengan peraturan perundang undangan.', order: 2 },
  // Clause 6.9
  { code: '6.9.1', clauseCode: '6.9', name: 'Procedures for selecting the condition of the workforce as well as the damaged production facilities and equipment have been established and can be implemented as soon as possible after the occurrence of accidents and occupational diseases.', description: 'Prosedur untuk pemilihan kondisi tenaga Kerja maupun sarana dan peralatan produksi yang mengalami kerusakan telah ditetapkan dan dapat diterapkan sesegera mungkin setelah terjadinya kecelakaan dan penyakit akibat kerja.', order: 1 },
  // Clause 7.1
  { code: '7.1.1', clauseCode: '7.1', name: 'Inspection of the workplace and working methods are carried out regularly', description: 'Pemeriksaan / inspeksi terhadap tempat kerja dan cara kerja dilaksanakan secara teratur', order: 1 },
  { code: '7.1.2', clauseCode: '7.1', name: 'The inspection is carried out by competent and authorized officers who have received training on hazard identification.', description: 'Pemeriksaan  / Inspeksi dilaksanakan oleh petugas yang kompeten  dan berwenang yang telah memperoleh pelatihan mengenai identifikasi bahaya.', order: 2 },
  { code: '7.1.3', clauseCode: '7.1', name: 'Inspection seeks input from workers who carry out tasks at the inspected place.', description: 'Pemeriksaan / inspeksi mencari masukan dari tenaga kerja yang melakukan tugas ditempat yang diperiksa.', order: 3 },
  { code: '7.1.4', clauseCode: '7.1', name: 'A workplace checklist has been compiled for use during inspections', description: 'Daftar periksa (check List) tempat kerja telah disusun untuk digunakan pada saat pemeriksaan / inspeksi.', order: 4 },
  { code: '7.1.5', clauseCode: '7.1', name: 'The inspection report contains recommendations for corrective action and is submitted to the management and Safety Committee as needed.', description: 'Laporan pemeriksaan / inspeksi berisi rekomendasi untuk tindakan perbaikan dan diajukan kepada pengurus dan P2K3 sesuai dengan kebutuhan.', order: 5 },
  { code: '7.1.6', clauseCode: '7.1', name: 'The management have determined the person in charge for the implementation of corrective actions from the results of the inspection report.', description: 'Pengusaha dan pengurus telah menetapkan penanggung jawab untuk  pelaksanaan tindakan perbaikan dari hasil  laporan pemeriksaan.', order: 6 },
  { code: '7.1.7', clauseCode: '7.1', name: 'Corrective actions from the results of the inspection report are monitored to determine their effectiveness.', description: 'Tindakan perbaikan dari hasil laporan   pemeriksaan / inspeksi dipantau untuk  menentukan efektifitasnya.', order: 7 },
  // Clause 7.2
  { code: '7.2.1', clauseCode: '7.2', name: 'Monitoring / measurement of the work environment is carried out regularly and the results are documented, maintained and used for risk assessment and control.', description: 'Pemantauan / pengukuran lingkungan kerja dilaksanakan secara teratur dan hasilnya didokumentasikan, dipelihara dan digunakan untuk penilaian dan  pengendalian risiko.', order: 1 },
  { code: '7.2.2', clauseCode: '7.2', name: 'Monitoring/measurement of the work environment includes physical, chemical, biological, ergonomic, and psychological factors.', description: 'Pemantauan / pengukuran  lingkungan kerja meliputi faktor fisik, kimia, biologis, ergonomi, dan psikologis.', order: 2 },
  { code: '7.2.3', clauseCode: '7.2', name: 'Monitoring/measurement of the work environment is carried out by competent and authorized officers or parties from within and/or outside the company.', description: 'Pemantauan / pengukuran lingkungan kerja dilakukan oleh petugas atau pihak  yang berkopeten dan berwenang dari dalam dan / atau luar perusahaan.', order: 3 },
  // Clause 7.3
  { code: '7.3.1', clauseCode: '7.3', name: 'There are documented procedures regarding identification, calibration, maintenance and storage for inspection, measuring and testing equipment regarding OHS', description: 'Terdapat  prosedur yang terdokumentasi  mengenai identifikasi, kalibrasi.pemeliharaan dan penyimpanan untuk alat pemeriksaan, ukur dan uji mengenai K3', order: 1 },
  { code: '7.3.2', clauseCode: '7.3', name: 'Tools are maintained and calibrated by competent and authorized officers or parties from within and/or outside the company.', description: 'Alat dipelihara dan dikalibrasi oleh petugas atau pihak yang berkompeten dan berwenang dari dalam dan / atau Luar perusahaan.', order: 2 },
  // Clause 7.4
  { code: '7.4.1', clauseCode: '7.4', name: 'Monitoring the health of workers who work in places containing high potential hazards in accordance with statutory regulations.', description: 'Dilakukan pemantauan kesehatan tenaga kerja yang bekerja pada tempat yang mengandung potensi bahaya tinggi sesuai dengan peraturan perundang-undangan.', order: 1 },
  { code: '7.4.2', clauseCode: '7.4', name: 'Employers or administrators have identified conditions in which workers\' health checks need to be carried out and have implemented a system to assist these inspections.', description: 'Pengusaha atau pengurus telah melaksanakan identifikasi keadaan dimana pemeriksaan kesehatan tenaga kerja perlu dilakukan dan telah melaksanakan sistem untuk membantu pemeriksaan ini.', order: 2 },
  { code: '7.4.3', clauseCode: '7.4', name: 'The health examination of the workforce is carried out by an examining doctor who is appointed according to the legislation.', description: 'Pemeriksaan kesehatan tenaga kerja dilakukan oleh Dokter pemeriksa yang ditunjuk sesuai peraturan perundangan.', order: 3 },
  { code: '7.4.4', clauseCode: '7.4', name: 'The company provides occupational health services in accordance with statutory regulations', description: 'Perusahaan menyediakan pelayanan kesehatan kerja sesuai peraturan perundang-undangan', order: 4 },
  { code: '7.4.5', clauseCode: '7.4', name: 'Records regarding the health monitoring of workers are made in accordance with statutory regulations.', description: 'Catatan mengenai pemantauan kesehatan Tenaga kerja dibuat sesuai dengan peraturan perundang - undangan.', order: 5 },
  // Clause 8.1
  { code: '8.1.1', clauseCode: '8.1', name: 'There is a hazard reporting procedure related to OSH and this procedure is known to the workforce.', description: 'Terdapat prosedur pelaporan bahaya yang berhubungan dengan K3 dan prosedur ini diketahui oleh tenaga kerja.', order: 1 },
  // Clause 8.2
  { code: '8.2.1', clauseCode: '8.2', name: 'There is a documented procedure that ensures that all work accidents, occupational diseases, fires or explosions as well as other hazardous events in the workplace are recorded and reported in accordance with statutory regulations.', description: 'Terdapat prosedur terdokumentasi yang menjamin bahwa semua kecelakaan kerja, penyakit akibat kerja, kebakaran atau peledakan serta kejadian berbahaya lainnya di tempat kerja dicatat dan dilaporkan sesuai dengan peraturan perundang-undangan.', order: 1 },
  // Clause 8.3
  { code: '8.3.1', clauseCode: '8.3', name: 'The workplace/company has procedures for examining and assessing work accidents and occupational diseases', description: 'Tempat kerja / perusahaan mempunyai prosedur pemeriksaan dan pengkajian kecelakaan kerja dan penyakit akibat kerja', order: 1 },
  { code: '8.3.2', clauseCode: '8.3', name: 'Examination and assessment of work accidents is carried out by appointed OHS officers or experts in accordance with statutory regulations or other competent and authorized parties.', description: 'Pemeriksaan dan pengkajian kecelakaan kerja dilakukan oleh petugas atau ahli K3 yang ditunjuk sesuai peraturan perundang-undangan atau pihak lain yang berkompeten dan berwenang.', order: 2 },
  { code: '8.3.3', clauseCode: '8.3', name: 'The inspection and assessment report contains the causes and effects as well as recommendations/suggestions and a time schedule for the implementation of improvement efforts', description: 'Laporan pemeriksaan dan pengkajian berisi tentang sebab dan akibat serta rekomendasi / saran dan jadwal waktu pelaksanaan usaha perbaikan', order: 3 },
  { code: '8.3.4', clauseCode: '8.3', name: 'The person in charge of carrying out corrective action on the inspection and assessment report has been assigned.', description: 'Penanggung jawab untuk melaksanakan tindakan perbaikan atas laporan pemeriksaan dan pengkajian telah ditetapkan.', order: 4 },
  { code: '8.3.5', clauseCode: '8.3', name: 'Corrective actions are informed to workers who work at the place where the accident occurred.', description: 'Tindakan perbaikan diinformasikan kepada tenaga kerja yang bekerja di tempat terjadinya kecelakaan.', order: 5 },
  { code: '8.3.6', clauseCode: '8.3', name: 'The implementation of corrective actions is monitored, documented and informed to the entire workforce.', description: 'Pelaksanaan tindakan perbaikan dipantau, didokumentasikan dan diinformasikan keseluruh tenaga kerja.', order: 6 },
  // Clause 8.4
  { code: '8.4.1', clauseCode: '8.4', name: 'There are procedures to deal with safety and health issues that arise and are in accordance with the applicable laws and regulations.', description: 'Terdapat prosedur untuk menangani masalah Keselamatan dan kesehatan yang timbul dan sesuai dengan peraturan perundang-undangan yang berlaku.', order: 1 },
  // Clause 9.1
  { code: '9.1.1', clauseCode: '9.1', name: 'There are procedures for identifying potential hazards and assessing risks associated with manual and mechanical handling.', description: 'Terdapat prosedur untuk mengidentifikasi potensi bahaya dan menilai risiko yang berhubungan dengan penanganan secara manual dan mekanis.', order: 1 },
  { code: '9.1.2', clauseCode: '9.1', name: 'Hazard identification and risk assessment are carried out by competent and authorized personnel.', description: 'Identifikasi bahaya dan penilaian risiko  dilaksanakan oleh petugas yang berkompeten, dan berwenang.', order: 2 },
  { code: '9.1.3', clauseCode: '9.1', name: 'The company / management implements and reviews risk control methods related to manual and mechanical handling.', description: 'Perusahaan / pengurus menerapkan dan meninjau cara pengendalian risiko yang berhubungan dengan penanganan secara manual dan mekanis.', order: 3 },
  { code: '9.1.4', clauseCode: '9.1', name: 'There are procedures for material handling including methods of preventing damage, spills, and/or leaks.', description: 'Terdapat prosedur untuk penanganan bahan meliputi metode pencegahan terhadap kerusakan, tumpahan, dan / Atau kebocoran.', order: 4 },
  // Clause 9.2
  { code: '9.2.1', clauseCode: '9.2', name: 'There are procedures to ensure that Materials are stored and transferred in a safe manner in accordance with statutory regulations.', description: 'Terdapat prosedur yang menjamin bahwa Bahan disimpan dan dipindahkan dengan cara yang aman sesuai dengan peraturan perundang-undangan.', order: 1 },
  { code: '9.2.2', clauseCode: '9.2', name: 'There is a procedure that describes the requirements for controlling materials that can be damaged or expired.', description: 'Terdapat prosedur yang menjelaskan Persyaratan pengendalian bahan yang dapat rusak atau kadaluarsa.', order: 2 },
  { code: '9.2.3', clauseCode: '9.2', name: 'There are procedures to ensure that materials are disposed of in a safe manner in accordance with statutory regulations.', description: 'Terdapat prosedur yang menjamin bahwa bahan dibuang dengan cara yang aman sesuai dengan peraturan perundangan.', order: 3 },
  // Clause 9.3
  { code: '9.3.1', clauseCode: '9.3', name: 'The Company has documented and implemented procedures regarding the storage, handling, and transfer of hazardous chemicals (BKB) in accordance with the requirements of laws and regulations, relevant technical standards and guidelines.', description: 'Perusahaan telah mendokumentasikan dan menerapkan prosedur mengenai penyimpanan, penanganan, dan pemindahan bahan kimia berbahaya (BKB) sesuai dengan persyaratan peraturan perundang-undangan, standar dan pedoman teknis yang relevan.', order: 1 },
  { code: '9.3.2', clauseCode: '9.3', name: 'There is a Material Safety Data Sheet Hazardous Chemicals (MSDS) includes information regarding the safety of materials as regulated in laws and regulations and can easily be obtained.', description: 'Terdapat lembar Data Keselamatan Bahan Kimia Berbahaya (MSDS)  meliputi keterangan menganai keselamatan bahan sebagaimana diatur pada peraturan perundang-undangan dan dengan mudah dapat diperoleh.', order: 2 },
  { code: '9.3.3', clauseCode: '9.3', name: 'There is a system in place to identify and clearly label hazardous chemicals.', description: 'Terdapat sistem untuk mengidentifikasi dan pemberian label secara jelas pada bahan kimia berbahaya.', order: 3 },
  { code: '9.3.4', clauseCode: '9.3', name: 'Hazard warning signs are posted in accordance with the requirements of relevant laws and standards.', description: 'Rambu peringatan bahaya dipampang sesuai dengan persyaratan peraturan perundangan dan standar yang relevan.', order: 4 },
  { code: '9.3.5', clauseCode: '9.3', name: 'The handling of Hazardous chemical is carried out by competent and authorized officers.', description: 'Penanganan BKB dilakukan oleh petugas yang berkompeten berwenang.', order: 5 },
  // Clause 10.1
  { code: '10.1.1', clauseCode: '10.1', name: 'The management has documented and implemented procedures for identifying, collecting, filing, maintaining, storing and replacing OHS records.', description: 'Pengusaha atau pengurus telah mendokumentasikan dan menerapkan prosedur pelaksanaan identifikasi, pengumpulan,pengarsipan, pemeliharaan, penyimpanan dan penggantian catatan K3.', order: 1 },
  { code: '10.1.2', clauseCode: '10.1', name: 'Relevant OSH legislation, standards and technical guidelines are maintained in an easily accessible place.', description: 'Peraturan perundang-undangan, standar dan pedoman teknis K3 yang relevan dipelihara pada tempat yang mudah didapat.', order: 2 },
  { code: '10.1.3', clauseCode: '10.1', name: 'There are procedures that define the requirements for maintaining the confidentiality of Records.', description: 'Terdapat prosedur yang menentukan persyaratan  untuk menjaga kerahasiaan Catatan.', order: 3 },
  { code: '10.1.4', clauseCode: '10.1', name: 'Records of accident compensation and health rehabilitation of workers are maintained.', description: 'Catatan kompensasi kecelakaan dan Rehabilitasi kesehatan tenaga kerja dipelihara.', order: 4 },
  // Clause 10.2
  { code: '10.2.1', clauseCode: '10.2', name: 'The latest OSH data is collected and analysed.', description: 'Data K3 yang terbaru dikumpulkan dan dianalisa.', order: 1 },
  { code: '10.2.2', clauseCode: '10.2', name: 'Regular OHS performance reports are made and disseminated in the workplace.', description: 'Laporan rutin kinerja K3 dibuat dan Disebarluaskan di dalam  tempat kerja.', order: 2 },
  // Clause 11.1
  { code: '11.1.1', clauseCode: '11.1', name: 'Scheduled OHSMS internal audits are carried out to check the suitability of planning activities and to determine the effectiveness of these activities.', description: 'Audit internal SMK3 yang terjadwal dilaksanakan untuk memeriksa kesesuaian kegiatan perencanaan dan untuk menentukan efektifitas kegiatan tersebut.', order: 1 },
  { code: '11.1.2', clauseCode: '11.1', name: 'OHSMS Internal Audit is carried out by competent and authorized officers.', description: 'Audit Internal SMK3 dilakukan oleh petugas yang berkompeten dan berwenang.', order: 2 },
  { code: '11.1.3', clauseCode: '11.1', name: 'The audit report is distributed to the entrepreneur or management and other related officers and monitored to ensure that corrective action is taken.', description: 'Laporan audit didistribusikan kepada pengusaha atau pengurus dan petugas lain yang berkepentingan dan dipantau untuk menjamin dilakukan tindakan perbaikan.', order: 3 },
  // Clause 12.1
  { code: '12.1.1', clauseCode: '12.1', name: 'An analysis of the need for OHS training in accordance with the requirements of the legislation has been carried out.', description: 'Analisa kebutuhan pelatihan  K3 sesuai persyaratan peraturan perundang-undangan telah dilakukan.', order: 1 },
  { code: '12.1.2', clauseCode: '12.1', name: 'OSH training plans for all levels have been prepared.', description: 'Rencana pelatihan K3 bagi semua tingkatan telah disusun.', order: 2 },
  { code: '12.1.3', clauseCode: '12.1', name: 'The type of OSH training carried out must be adjusted to the need for controlling potential hazards.', description: 'Jenis Pelatihan K3 yang dilakukan harus disesuaikan  dengan kebutuhan untuk  pengendalian potensi bahaya.', order: 3 },
  { code: '12.1.4', clauseCode: '12.1', name: 'The training is carried out by a competent and authorized person or body in accordance with the laws and regulations.', description: 'Pelatihan dilakukan oleh orang atau badan yang berkompeten dan berwenang sesuai peraturan perundang-undangan.', order: 4 },
  { code: '12.1.5', clauseCode: '12.1', name: 'There are adequate facilities and resources for the effective implementation of training.', description: 'Terdapat fasilitas dan sumber daya memadai untuk pelaksanaan pelatihan yang efektif.', order: 5 },
  { code: '12.1.6', clauseCode: '12.1', name: 'The company or management documents and keeps records of all training.', description: 'Perusahaan atau pengurus mendokumentasikan dan menyimpan  catatan seluruh pelatihan.', order: 6 },
  { code: '12.1.7', clauseCode: '12.1', name: 'The training program is reviewed regularly to ensure that it remains relevant and effective.', description: 'Program pelatihan ditinjau secara teratur untuk menjamin agar tetap relevan dan efektif.', order: 7 },
  // Clause 12.2
  { code: '12.2.1', clauseCode: '12.2', name: 'Members of executive management and management participate in training which includes explanations of legal obligations and principles and implementation of OSH.', description: 'Anggota manajemen eksekutif dan pengurus berperan serta dalam pelatihan yang mencakup penjelasan tentang kewajiban hukum dan prinsip-prinsip serta pelaksanaan K3.', order: 1 },
  { code: '12.2.2', clauseCode: '12.2', name: 'Managers and supervisors receive training appropriate to their roles and responsibilities', description: 'Manajer dan pengawas / penyelia menerima pelatihan yang sesuai dengan peran dan tanggung jawab mereka', order: 2 },
  // Clause 12.3
  { code: '12.3.1', clauseCode: '12.3', name: 'Training is provided to all workers including new and transferred workers so that they can carry out their duties safely.', description: 'Pelatihan diberikan kepada semua tenaga kerja termasuk tenaga kerja baru dan yang dipindahkan agar mereka dapat melaksanakan tugasnya secara aman.', order: 1 },
  { code: '12.3.2', clauseCode: '12.3', name: 'Training is given to the workforce if there is a change in the means of production or the process of changing the means of production or process.', description: 'Pelatihan diberikan kepada tenaga kerja apabila ditempat kerjanya terjadi perubahan sarana produksi atau proses perubahan sarana produksi atau proses.', order: 2 },
  { code: '12.3.3', clauseCode: '12.3', name: 'Employers or administrators provide refresher training to all workers.', description: 'Pengusaha atau pengurus memberikan pelatihan penyegaran kepada semua tenaga kerja.', order: 3 },
  // Clause 12.4
  { code: '12.4.1', clauseCode: '12.4', name: 'There is a procedure that stipulates the requirements to provide briefings to visitors and business partners to ensure OSH.', description: 'Terdapat prosedur yang menetapkan persyaratan untuk memberikan Taklimat (briefing) kepada pengunjung dan mitra kerja guna menjamin K3.', order: 1 },
  // Clause 12.5
  { code: '12.5.1', clauseCode: '12.5', name: 'The company has a system that ensures compliance with licensing or qualification requirements in accordance with laws and regulations to carry out special tasks, carry out work or operate equipment.', description: 'Perusahaan mempunyai sistem yang menjamin kepatuhan terhadap persyaratan lisensi atau kualifikasi sesuai dengan peraturan perundangan untuk melaksanakan tugas khusus, melaksanakan pekerjaan atau mengoperasikan peralatan.', order: 1 },
];

export async function seedAuditPolicy(prisma: PrismaClient) {
  console.log('Creating audit policy data...');

  // Clear existing audit data
  await prisma.auditCriteria.deleteMany();
  await prisma.auditClause.deleteMany();
  await prisma.auditElement.deleteMany();

  // Create elements
  const createdElements = await Promise.all(
    auditElements.map((element) =>
      prisma.auditElement.create({
        data: {
          code: element.code,
          name: element.name,
          description: element.description,
          isActive: true,
        },
      }),
    ),
  );

  console.log(`Created ${createdElements.length} audit elements`);

  // Create a map of element codes to IDs
  const elementMap = new Map(
    createdElements.map((el) => [el.code, el.id]),
  );

  // Create clauses
  const createdClauses = await Promise.all(
    auditClauses.map((clause) =>
      prisma.auditClause.create({
        data: {
          code: clause.code,
          name: clause.name,
          description: clause.description,
          auditElementId: elementMap.get(clause.elementCode)!,
          order: clause.order,
          isActive: true,
        },
      }),
    ),
  );

  console.log(`Created ${createdClauses.length} audit clauses`);

  // Create a map of clause codes to IDs
  const clauseMap = new Map(
    createdClauses.map((cl) => [cl.code, cl.id]),
  );

  // Create criteria
  const createdCriteria = await Promise.all(
    auditCriteria.map((criterion) =>
      prisma.auditCriteria.create({
        data: {
          code: criterion.code,
          name: criterion.name,
          description: criterion.description,
          auditClauseId: clauseMap.get(criterion.clauseCode)!,
          transitionType: TransitionTypeEnum.INITIAL,
          order: criterion.order,
          isActive: true,
        },
      }),
    ),
  );

  console.log(`Created ${createdCriteria.length} audit criteria`);

  return {
    elements: createdElements,
    clauses: createdClauses,
    criteria: createdCriteria,
  };
}
