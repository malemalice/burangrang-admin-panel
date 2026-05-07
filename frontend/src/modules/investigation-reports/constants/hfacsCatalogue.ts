import { InvestigationCauseSectionEnum } from '../types/investigation-report.types';

export interface HfacsItem {
  causeKey: string;
  labelEn: string;
  labelId: string;
  isOther?: boolean;
}

export interface HfacsTier2 {
  tier2: string;
  labelEn: string;
  labelId: string;
  group?: string;
  items: HfacsItem[];
}

export interface HfacsTier1 {
  tier1: string;
  labelEn: string;
  labelId: string;
  tier2s: HfacsTier2[];
}

const o = (k: string, en: string, id: string): HfacsItem => ({
  causeKey: k,
  labelEn: en,
  labelId: id,
  isOther: en === 'Others',
});

export const HFACS_LATENT_FAILURE: HfacsTier1[] = [
  {
    tier1: 'ORGANIZATIONAL_INFLUENCES',
    labelEn: 'Organizational Influences',
    labelId: 'Pengaruh Organisasi',
    tier2s: [
      {
        tier2: 'ORGANIZATIONAL_CLIMATE',
        labelEn: 'Organizational Climate',
        labelId: 'Iklim Organisasi',
        items: [
          o('OC_001', 'Long chain of command structure', 'Rantai struktur komando terlalu panjang'),
          o('OC_002', 'Inappropriate delegation of authority and responsibility', 'Pendelegasian wewenang dan tanggung jawab yang tidak tepat'),
          o('OC_003', 'Abuse of authority', 'Penyalahgunaan/Penyelewengan wewenang'),
          o('OC_004', 'Inappropriate policy', 'Kebijakan tidak sesuai'),
          o('OC_005', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'ORGANIZATIONAL_PROCESS',
        labelEn: 'Organizational Process',
        labelId: 'Proses Organisasi',
        items: [
          o('OP_001', 'Lack of communication', 'Kurangnya komunikasi'),
          o('OP_002', 'Inadequate planning work or schedule', 'Perencanaan kerja atau jadwal kurang memadai'),
          o('OP_003', 'Inadequate standard / procedure', 'Standard/prosedur kerja kurang memadai'),
          o('OP_004', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'RESOURCE_MANAGEMENT',
        labelEn: 'Resource Management',
        labelId: 'Pengaturan Sumberdaya',
        items: [
          o('RM_001', 'Inappropriate placement of workers', 'Penempatan pekerja yang tidak tepat'),
          o('RM_002', 'Inappropriate budget plan', 'Perencanaan anggaran yang tidak tepat'),
          o('RM_003', 'Inappropriate maintenance facility and equipment', 'Pemeliharaan fasilitas dan peralatan kurang memadai'),
          o('RM_004', 'Inadequate procurement system', 'Sistem pengadaan yang tidak memadai'),
          o('RM_005', 'Bad housekeeping', 'Tata graha yang tidak baik'),
          o('RM_006', 'Obsolete facility', 'Fasilitas yang usang'),
          o('RM_007', 'Others', 'Lain-lain'),
        ],
      },
    ],
  },
  {
    tier1: 'UNSAFE_SUPERVISION',
    labelEn: 'Unsafe Supervision',
    labelId: 'Pengawasan Tidak Aman',
    tier2s: [
      {
        tier2: 'INADEQUATE_SUPERVISION',
        labelEn: 'Inadequate Supervision',
        labelId: 'Pengawasan yang tidak memadai',
        items: [
          o('IS_001', 'Never or rarely supervise subordinates', 'Tidak pernah atau jarang mengawasi bawahannya'),
          o('IS_002', 'Never or rarely train subordinates', 'Tidak pernah atau jarang melatih bawahannya'),
          o('IS_003', 'Lack of motivating employees', 'Kurang memotivasi karyawan'),
          o('IS_004', 'Instructions or directions not clearly given', 'Instruksi atau arahan tidak diberikan dengan jelas oleh pengawas'),
          o('IS_005', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'PLANNED_INAPPROPRIATE_OPERATIONS',
        labelEn: 'Planned Inappropriate Operations',
        labelId: 'Menjalankan Operasi yang tidak sesuai perencanaan',
        items: [
          o('PIO_001', 'Giving assignments not matching abilities of subordinates', 'Memberikan tugas yang tidak sesuai dengan kemampuan bawahannya'),
          o('PIO_002', 'Inadequate planning', 'Perencanaan yang tidak memadai'),
          o('PIO_003', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'FAILED_TO_CORRECT_PROBLEM',
        labelEn: 'Failed to Correct Problem',
        labelId: 'Gagal memperbaiki masalah',
        items: [
          o('FCP_001', 'Fail to correct wrong document', 'Gagal memperbaiki dokumen yang salah'),
          o('FCP_002', 'Fail to identify the risk', 'Gagal mengidentifikasi risiko'),
          o('FCP_003', 'Reliance on undocumented knowledge', 'Ketergantungan pada pengetahuan Tidak Berdokumen'),
          o('FCP_004', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'SUPERVISORY_VIOLATION',
        labelEn: 'Supervisory Violation',
        labelId: 'Pelanggaran pengawas',
        items: [
          o('SV_001', 'Violate standard operating procedures (routine or extraordinary)', 'Melanggar standar operasi prosedur secara rutin atau sesekali'),
          o('SV_002', 'Abuse of authority', 'Penyalahgunaan wewenang'),
          o('SV_003', 'Others', 'Lain-lain'),
        ],
      },
    ],
  },
  {
    tier1: 'PRECONDITION_UNSAFE_ACTS',
    labelEn: 'Precondition for Unsafe Acts',
    labelId: 'Prakondisi untuk Tindakan Tidak Aman',
    tier2s: [
      {
        tier2: 'PHYSICAL_ENVIRONMENT',
        labelEn: 'Physical Environment',
        labelId: 'Lingkungan Fisik',
        items: [
          o('PE_001', 'Confined space', 'Ruang dengan ukuran terbatas/tertutup'),
          o('PE_002', 'Fire / Explosion', 'Api/Ledakan'),
          o('PE_003', 'Noise', 'Kebisingan'),
          o('PE_004', 'Radiation', 'Radiasi'),
          o('PE_005', 'Low / High temperature', 'Suhu Tinggi/rendah'),
          o('PE_006', 'Gas', 'Gas'),
          o('PE_007', 'Vapour', 'Uap'),
          o('PE_008', 'Smell', 'Bau'),
          o('PE_009', 'Weather', 'Cuaca'),
          o('PE_010', 'Altitude (working at height)', 'Ketinggian'),
          o('PE_011', 'Vibration', 'Getaran'),
          o('PE_012', 'Thunder / Lightning', 'Petir'),
          o('PE_013', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'TECHNOLOGICAL_ENVIRONMENT',
        labelEn: 'Technological Environment',
        labelId: 'Lingkungan Teknologi',
        items: [
          o('TE_001', 'Damage / inadequate material or equipment', 'Alat, peralatan atau bahan yang rusak atau tidak memadai'),
          o('TE_002', 'Improper protection system', 'Sistem perlindungan yang tidak tepat'),
          o('TE_003', 'Inadequate warning system', 'Sistem peringatan tak memadai'),
          o('TE_004', 'Inadequate ventilation', 'Ventilasi yang tidak memadai'),
          o('TE_005', 'Inadequate lighting', 'Pencahayaan yang tidak memadai'),
          o('TE_006', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'ADVERSE_MENTAL_STATES',
        group: 'CONDITION_OF_OPERATORS',
        labelEn: 'Adverse Mental States',
        labelId: 'Kondisi mental yang merugikan',
        items: [
          o('AMS_001', 'Mental fatigue', 'Kelelahan mental'),
          o('AMS_002', 'Over confidence', 'Terlalu percaya diri'),
          o('AMS_003', 'Wrong motivation', 'Motivasi yang salah'),
          o('AMS_004', 'Stress', 'Ketegangan mental atau emosional'),
          o('AMS_005', 'Failure of motivation', 'Kegagalan motivasi'),
          o('AMS_006', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'ADVERSE_PHYSIOLOGICAL_STATE',
        group: 'CONDITION_OF_OPERATORS',
        labelEn: 'Adverse Physiological State',
        labelId: 'Keadaan fisiologis yang merugikan',
        items: [
          o('APS_001', 'Medical illness', 'Penyakit medis'),
          o('APS_002', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'PHYSICAL_MENTAL_LIMITATIONS',
        group: 'CONDITION_OF_OPERATORS',
        labelEn: 'Physical / Mental Limitations',
        labelId: 'Keterbatasan Mental/fisik',
        items: [
          o('PML_001', 'Body size / ability does not match the job', 'Ukuran/kemampuan tubuh tidak sesuai dengan pekerjaannya'),
          o('PML_002', 'Disability', 'Disabilitas'),
          o('PML_003', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'CREW_RESOURCE_MISMANAGEMENT',
        group: 'PERSONNEL_FACTORS',
        labelEn: 'Crew Resource Mismanagement',
        labelId: 'Salah pengelolaan sumberdaya manusia',
        items: [
          o('CRM_001', 'Weak coordination between workers', 'Koordinasi yang lemah antar pekerja'),
          o('CRM_002', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'PERSONAL_READINESS',
        group: 'PERSONNEL_FACTORS',
        labelEn: 'Personal Readiness',
        labelId: 'Kesiapan individu',
        items: [
          o('PR_001', 'Unfit to work', 'Tidak layak untuk bekerja'),
          o('PR_002', 'Drugs', 'Dalam pengaruh obat-obatan'),
          o('PR_003', 'Others', 'Lain-lain'),
        ],
      },
    ],
  },
];

export const HFACS_ACTIVE_FAILURE: HfacsTier1[] = [
  {
    tier1: 'UNSAFE_ACTS',
    labelEn: 'Unsafe Acts',
    labelId: 'Tindakan Tidak Aman',
    tier2s: [
      {
        tier2: 'DECISION_ERROR',
        group: 'ERROR',
        labelEn: 'Decision Error',
        labelId: 'Keputusan',
        items: [
          o('DE_001', 'Wrong use of SOP', 'Penggunaan SOP yang salah'),
          o('DE_002', 'Bad choice', 'Pilihan yang buruk'),
          o('DE_003', 'Problem solving errors', 'Kesalahan penyelesaian masalah'),
          o('DE_004', 'Unauthorized equipment operation', 'Pengoperasian peralatan yang tidak sah'),
          o('DE_005', 'Remove the equipment protection system', 'Melepaskan sistem perlindungan peralatan'),
          o('DE_006', 'Make equipment not functioning', 'Membuat peralatan tidak berfungsi'),
          o('DE_007', 'Joking', 'Bercanda'),
          o('DE_008', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'SKILL_BASED_ERROR',
        group: 'ERROR',
        labelEn: 'Skill-Based Error',
        labelId: 'Berbasis keterampilan',
        items: [
          o('SE_001', 'Wrong implement SOP', 'Implementasi SOP yang salah'),
          o('SE_002', 'Forgot something mandatory to do', 'Lupa sesuatu yang wajib dilakukan'),
          o('SE_003', 'Improper lifting', 'Pengangkatan yang tidak benar'),
          o('SE_004', 'Repair live engine', 'Memperbaiki mesin hidup'),
          o('SE_005', 'Lack of knowledge', 'Kurangnya pengetahuan'),
          o('SE_006', 'Unskilled', 'Tidak terampil'),
          o('SE_007', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'PERCEPTUAL_ERROR',
        group: 'ERROR',
        labelEn: 'Perceptual Error',
        labelId: 'Kesalahan Persepsi',
        items: [
          o('PCE_001', 'Wrong calculation', 'Perhitungan yang salah'),
          o('PCE_002', 'Use of improper equipment', 'Penggunaan peralatan yang tidak tepat'),
          o('PCE_003', 'Use of damaged equipment', 'Penggunaan peralatan kerusakan'),
          o('PCE_004', 'Improper loading capacity', 'Kapasitas pemuatan yang tidak tepat'),
          o('PCE_005', 'Improper placement', 'Penempatan yang tidak tepat'),
          o('PCE_006', 'Reliance on undocumented knowledge', 'Ketergantungan pada Pengetahuan Tidak Berdokumen'),
          o('PCE_007', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'ROUTINE_VIOLATION',
        group: 'VIOLATION',
        labelEn: 'Routine Violation',
        labelId: 'Rutin',
        items: [
          o('RV_001', 'Did not attend pre-start meeting (toolbox meeting)', 'Tidak menghadiri pertemuan pra-mulai pekerjaan'),
          o('RV_002', 'Overspeed', 'Melebihi batas kecepatan'),
          o('RV_003', 'Failed to use PPE', 'Gagal menggunakan APD'),
          o('RV_004', 'Abuse of authority', 'Penyalahgunaan wewenang'),
          o('RV_005', 'Others', 'Lain-lain'),
        ],
      },
      {
        tier2: 'EXCEPTIONAL_VIOLATION',
        group: 'VIOLATION',
        labelEn: 'Exceptional Violation',
        labelId: 'Se-sekali',
        items: [
          o('EV_001', 'Others', 'Lain-lain'),
        ],
      },
    ],
  },
];

export const HFACS_CATALOGUE: Record<InvestigationCauseSectionEnum, HfacsTier1[]> = {
  [InvestigationCauseSectionEnum.LATENT_FAILURE]: HFACS_LATENT_FAILURE,
  [InvestigationCauseSectionEnum.ACTIVE_FAILURE]: HFACS_ACTIVE_FAILURE,
};

export interface HfacsLookupEntry {
  section: InvestigationCauseSectionEnum;
  tier1: string;
  tier2: string;
  labelEn: string;
  labelId: string;
}

export const HFACS_LOOKUP: Map<string, HfacsLookupEntry> = (() => {
  const map = new Map<string, HfacsLookupEntry>();
  (Object.entries(HFACS_CATALOGUE) as Array<[InvestigationCauseSectionEnum, HfacsTier1[]]>).forEach(
    ([section, tiers]) => {
      tiers.forEach((t1) => {
        t1.tier2s.forEach((t2) => {
          t2.items.forEach((item) => {
            map.set(item.causeKey, {
              section,
              tier1: t1.tier1,
              tier2: t2.tier2,
              labelEn: item.labelEn,
              labelId: item.labelId,
            });
          });
        });
      });
    },
  );
  return map;
})();
