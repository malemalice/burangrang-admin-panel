/**
 * Seed: HFACS Catalogue (m_hfacs_nodes)
 *
 * Populates the HFACS cause master with the canonical Tier1 → Tier2 → Item tree
 * used in Sections H (Latent Failure / Indirect Cause) and I (Active Failure /
 * Direct Cause) of the Investigation Report.
 *
 * Idempotent — uses the natural key (parentId, labelEn) for upsert at each level.
 * Item leaves additionally upsert by their stable `code` (e.g. OC_001, DE_001).
 */
import { InvestigationCauseSectionEnum } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

interface ItemSpec {
  code: string;
  labelEn: string;
  labelId: string;
}

interface Tier2Spec {
  labelEn: string;
  labelId: string;
  items: ItemSpec[];
}

interface Tier1Spec {
  labelEn: string;
  labelId: string;
  tier2s: Tier2Spec[];
}

interface SectionSpec {
  section: InvestigationCauseSectionEnum;
  tier1s: Tier1Spec[];
}

const isOther = (en: string) => en === 'Others';

const CATALOGUE: SectionSpec[] = [
  {
    section: 'LATENT_FAILURE',
    tier1s: [
      {
        labelEn: 'Organizational Influences',
        labelId: 'Pengaruh Organisasi',
        tier2s: [
          {
            labelEn: 'Organizational Climate',
            labelId: 'Iklim Organisasi',
            items: [
              { code: 'OC_001', labelEn: 'Long chain of command structure', labelId: 'Rantai struktur komando terlalu panjang' },
              { code: 'OC_002', labelEn: 'Inappropriate delegation of authority and responsibility', labelId: 'Pendelegasian wewenang dan tanggung jawab yang tidak tepat' },
              { code: 'OC_003', labelEn: 'Abuse of authority', labelId: 'Penyalahgunaan/Penyelewengan wewenang' },
              { code: 'OC_004', labelEn: 'Inappropriate policy', labelId: 'Kebijakan tidak sesuai' },
              { code: 'OC_005', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Organizational Process',
            labelId: 'Proses Organisasi',
            items: [
              { code: 'OP_001', labelEn: 'Lack of communication', labelId: 'Kurangnya komunikasi' },
              { code: 'OP_002', labelEn: 'Inadequate planning work or schedule', labelId: 'Perencanaan kerja atau jadwal kurang memadai' },
              { code: 'OP_003', labelEn: 'Inadequate standard / procedure', labelId: 'Standard/prosedur kerja kurang memadai' },
              { code: 'OP_004', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Resource Management',
            labelId: 'Pengaturan Sumberdaya',
            items: [
              { code: 'RM_001', labelEn: 'Inappropriate placement of workers', labelId: 'Penempatan pekerja yang tidak tepat' },
              { code: 'RM_002', labelEn: 'Inappropriate budget plan', labelId: 'Perencanaan anggaran yang tidak tepat' },
              { code: 'RM_003', labelEn: 'Inappropriate maintenance facility and equipment', labelId: 'Pemeliharaan fasilitas dan peralatan kurang memadai' },
              { code: 'RM_004', labelEn: 'Inadequate procurement system', labelId: 'Sistem pengadaan yang tidak memadai' },
              { code: 'RM_005', labelEn: 'Bad housekeeping', labelId: 'Tata graha yang tidak baik' },
              { code: 'RM_006', labelEn: 'Obsolete facility', labelId: 'Fasilitas yang usang' },
              { code: 'RM_007', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
        ],
      },
      {
        labelEn: 'Unsafe Supervision',
        labelId: 'Pengawasan Tidak Aman',
        tier2s: [
          {
            labelEn: 'Inadequate Supervision',
            labelId: 'Pengawasan yang tidak memadai',
            items: [
              { code: 'IS_001', labelEn: 'Never or rarely supervise subordinates', labelId: 'Tidak pernah atau jarang mengawasi bawahannya' },
              { code: 'IS_002', labelEn: 'Never or rarely train subordinates', labelId: 'Tidak pernah atau jarang melatih bawahannya' },
              { code: 'IS_003', labelEn: 'Lack of motivating employees', labelId: 'Kurang memotivasi karyawan' },
              { code: 'IS_004', labelEn: 'Instructions or directions not clearly given', labelId: 'Instruksi atau arahan tidak diberikan dengan jelas oleh pengawas' },
              { code: 'IS_005', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Planned Inappropriate Operations',
            labelId: 'Menjalankan Operasi yang tidak sesuai perencanaan',
            items: [
              { code: 'PIO_001', labelEn: 'Giving assignments not matching abilities of subordinates', labelId: 'Memberikan tugas yang tidak sesuai dengan kemampuan bawahannya' },
              { code: 'PIO_002', labelEn: 'Inadequate planning', labelId: 'Perencanaan yang tidak memadai' },
              { code: 'PIO_003', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Failed to Correct Problem',
            labelId: 'Gagal memperbaiki masalah',
            items: [
              { code: 'FCP_001', labelEn: 'Fail to correct wrong document', labelId: 'Gagal memperbaiki dokumen yang salah' },
              { code: 'FCP_002', labelEn: 'Fail to identify the risk', labelId: 'Gagal mengidentifikasi risiko' },
              { code: 'FCP_003', labelEn: 'Reliance on undocumented knowledge', labelId: 'Ketergantungan pada pengetahuan Tidak Berdokumen' },
              { code: 'FCP_004', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Supervisory Violation',
            labelId: 'Pelanggaran pengawas',
            items: [
              { code: 'SV_001', labelEn: 'Violate standard operating procedures (routine or extraordinary)', labelId: 'Melanggar standar operasi prosedur secara rutin atau sesekali' },
              { code: 'SV_002', labelEn: 'Abuse of authority', labelId: 'Penyalahgunaan wewenang' },
              { code: 'SV_003', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
        ],
      },
      {
        labelEn: 'Precondition for Unsafe Acts',
        labelId: 'Prakondisi untuk Tindakan Tidak Aman',
        tier2s: [
          {
            labelEn: 'Physical Environment',
            labelId: 'Lingkungan Fisik',
            items: [
              { code: 'PE_001', labelEn: 'Confined space', labelId: 'Ruang dengan ukuran terbatas/tertutup' },
              { code: 'PE_002', labelEn: 'Fire / Explosion', labelId: 'Api/Ledakan' },
              { code: 'PE_003', labelEn: 'Noise', labelId: 'Kebisingan' },
              { code: 'PE_004', labelEn: 'Radiation', labelId: 'Radiasi' },
              { code: 'PE_005', labelEn: 'Low / High temperature', labelId: 'Suhu Tinggi/rendah' },
              { code: 'PE_006', labelEn: 'Gas', labelId: 'Gas' },
              { code: 'PE_007', labelEn: 'Vapour', labelId: 'Uap' },
              { code: 'PE_008', labelEn: 'Smell', labelId: 'Bau' },
              { code: 'PE_009', labelEn: 'Weather', labelId: 'Cuaca' },
              { code: 'PE_010', labelEn: 'Altitude (working at height)', labelId: 'Ketinggian' },
              { code: 'PE_011', labelEn: 'Vibration', labelId: 'Getaran' },
              { code: 'PE_012', labelEn: 'Thunder / Lightning', labelId: 'Petir' },
              { code: 'PE_013', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Technological Environment',
            labelId: 'Lingkungan Teknologi',
            items: [
              { code: 'TE_001', labelEn: 'Damage / inadequate material or equipment', labelId: 'Alat, peralatan atau bahan yang rusak atau tidak memadai' },
              { code: 'TE_002', labelEn: 'Improper protection system', labelId: 'Sistem perlindungan yang tidak tepat' },
              { code: 'TE_003', labelEn: 'Inadequate warning system', labelId: 'Sistem peringatan tak memadai' },
              { code: 'TE_004', labelEn: 'Inadequate ventilation', labelId: 'Ventilasi yang tidak memadai' },
              { code: 'TE_005', labelEn: 'Inadequate lighting', labelId: 'Pencahayaan yang tidak memadai' },
              { code: 'TE_006', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Adverse Mental States',
            labelId: 'Kondisi mental yang merugikan',
            items: [
              { code: 'AMS_001', labelEn: 'Mental fatigue', labelId: 'Kelelahan mental' },
              { code: 'AMS_002', labelEn: 'Over confidence', labelId: 'Terlalu percaya diri' },
              { code: 'AMS_003', labelEn: 'Wrong motivation', labelId: 'Motivasi yang salah' },
              { code: 'AMS_004', labelEn: 'Stress', labelId: 'Ketegangan mental atau emosional' },
              { code: 'AMS_005', labelEn: 'Failure of motivation', labelId: 'Kegagalan motivasi' },
              { code: 'AMS_006', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Adverse Physiological State',
            labelId: 'Keadaan fisiologis yang merugikan',
            items: [
              { code: 'APS_001', labelEn: 'Medical illness', labelId: 'Penyakit medis' },
              { code: 'APS_002', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Physical / Mental Limitations',
            labelId: 'Keterbatasan Mental/fisik',
            items: [
              { code: 'PML_001', labelEn: 'Body size / ability does not match the job', labelId: 'Ukuran/kemampuan tubuh tidak sesuai dengan pekerjaannya' },
              { code: 'PML_002', labelEn: 'Disability', labelId: 'Disabilitas' },
              { code: 'PML_003', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Crew Resource Mismanagement',
            labelId: 'Salah pengelolaan sumberdaya manusia',
            items: [
              { code: 'CRM_001', labelEn: 'Weak coordination between workers', labelId: 'Koordinasi yang lemah antar pekerja' },
              { code: 'CRM_002', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Personal Readiness',
            labelId: 'Kesiapan individu',
            items: [
              { code: 'PR_001', labelEn: 'Unfit to work', labelId: 'Tidak layak untuk bekerja' },
              { code: 'PR_002', labelEn: 'Drugs', labelId: 'Dalam pengaruh obat-obatan' },
              { code: 'PR_003', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
        ],
      },
    ],
  },
  {
    section: 'ACTIVE_FAILURE',
    tier1s: [
      {
        labelEn: 'Unsafe Acts',
        labelId: 'Tindakan Tidak Aman',
        tier2s: [
          {
            labelEn: 'Decision Error',
            labelId: 'Keputusan',
            items: [
              { code: 'DE_001', labelEn: 'Wrong use of SOP', labelId: 'Penggunaan SOP yang salah' },
              { code: 'DE_002', labelEn: 'Bad choice', labelId: 'Pilihan yang buruk' },
              { code: 'DE_003', labelEn: 'Problem solving errors', labelId: 'Kesalahan penyelesaian masalah' },
              { code: 'DE_004', labelEn: 'Unauthorized equipment operation', labelId: 'Pengoperasian peralatan yang tidak sah' },
              { code: 'DE_005', labelEn: 'Remove the equipment protection system', labelId: 'Melepaskan sistem perlindungan peralatan' },
              { code: 'DE_006', labelEn: 'Make equipment not functioning', labelId: 'Membuat peralatan tidak berfungsi' },
              { code: 'DE_007', labelEn: 'Joking', labelId: 'Bercanda' },
              { code: 'DE_008', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Skill-Based Error',
            labelId: 'Berbasis keterampilan',
            items: [
              { code: 'SE_001', labelEn: 'Wrong implement SOP', labelId: 'Implementasi SOP yang salah' },
              { code: 'SE_002', labelEn: 'Forgot something mandatory to do', labelId: 'Lupa sesuatu yang wajib dilakukan' },
              { code: 'SE_003', labelEn: 'Improper lifting', labelId: 'Pengangkatan yang tidak benar' },
              { code: 'SE_004', labelEn: 'Repair live engine', labelId: 'Memperbaiki mesin hidup' },
              { code: 'SE_005', labelEn: 'Lack of knowledge', labelId: 'Kurangnya pengetahuan' },
              { code: 'SE_006', labelEn: 'Unskilled', labelId: 'Tidak terampil' },
              { code: 'SE_007', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Perceptual Error',
            labelId: 'Kesalahan Persepsi',
            items: [
              { code: 'PCE_001', labelEn: 'Wrong calculation', labelId: 'Perhitungan yang salah' },
              { code: 'PCE_002', labelEn: 'Use of improper equipment', labelId: 'Penggunaan peralatan yang tidak tepat' },
              { code: 'PCE_003', labelEn: 'Use of damaged equipment', labelId: 'Penggunaan peralatan kerusakan' },
              { code: 'PCE_004', labelEn: 'Improper loading capacity', labelId: 'Kapasitas pemuatan yang tidak tepat' },
              { code: 'PCE_005', labelEn: 'Improper placement', labelId: 'Penempatan yang tidak tepat' },
              { code: 'PCE_006', labelEn: 'Reliance on undocumented knowledge', labelId: 'Ketergantungan pada Pengetahuan Tidak Berdokumen' },
              { code: 'PCE_007', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Routine Violation',
            labelId: 'Rutin',
            items: [
              { code: 'RV_001', labelEn: 'Did not attend pre-start meeting (toolbox meeting)', labelId: 'Tidak menghadiri pertemuan pra-mulai pekerjaan' },
              { code: 'RV_002', labelEn: 'Overspeed', labelId: 'Melebihi batas kecepatan' },
              { code: 'RV_003', labelEn: 'Failed to use PPE', labelId: 'Gagal menggunakan APD' },
              { code: 'RV_004', labelEn: 'Abuse of authority', labelId: 'Penyalahgunaan wewenang' },
              { code: 'RV_005', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
          {
            labelEn: 'Exceptional Violation',
            labelId: 'Se-sekali',
            items: [
              { code: 'EV_001', labelEn: 'Others', labelId: 'Lain-lain' },
            ],
          },
        ],
      },
    ],
  },
];

export const seedHfacsCatalogue = async () => {
  console.log('🌱 Seeding HFACS catalogue...');

  try {
    let tier1Count = 0;
    let tier2Count = 0;
    let itemCount = 0;

    for (const sec of CATALOGUE) {
      let t1Order = 0;
      for (const t1 of sec.tier1s) {
        t1Order += 1;

        // Tier1: natural key (section, depth=0, labelEn) within non-deleted rows.
        const existingT1 = await prisma.hfacsNode.findFirst({
          where: {
            section: sec.section,
            depth: 0,
            labelEn: t1.labelEn,
            deletedAt: null,
          },
        });

        const tier1Node = existingT1
          ? await prisma.hfacsNode.update({
              where: { id: existingT1.id },
              data: {
                labelId: t1.labelId,
                order: t1Order,
                isActive: true,
              },
            })
          : await prisma.hfacsNode.create({
              data: {
                section: sec.section,
                depth: 0,
                labelEn: t1.labelEn,
                labelId: t1.labelId,
                order: t1Order,
                isActive: true,
              },
            });
        tier1Count += 1;

        let t2Order = 0;
        for (const t2 of t1.tier2s) {
          t2Order += 1;

          const existingT2 = await prisma.hfacsNode.findFirst({
            where: {
              parentId: tier1Node.id,
              depth: 1,
              labelEn: t2.labelEn,
              deletedAt: null,
            },
          });

          const tier2Node = existingT2
            ? await prisma.hfacsNode.update({
                where: { id: existingT2.id },
                data: {
                  labelId: t2.labelId,
                  order: t2Order,
                  isActive: true,
                },
              })
            : await prisma.hfacsNode.create({
                data: {
                  parentId: tier1Node.id,
                  section: sec.section,
                  depth: 1,
                  labelEn: t2.labelEn,
                  labelId: t2.labelId,
                  order: t2Order,
                  isActive: true,
                },
              });
          tier2Count += 1;

          let itemOrder = 0;
          for (const item of t2.items) {
            itemOrder += 1;

            // Items: natural key is `code` (e.g. OC_001), unique across the catalogue.
            const existingItem = await prisma.hfacsNode.findFirst({
              where: { code: item.code, deletedAt: null },
            });

            if (existingItem) {
              await prisma.hfacsNode.update({
                where: { id: existingItem.id },
                data: {
                  parentId: tier2Node.id,
                  section: sec.section,
                  depth: 2,
                  labelEn: item.labelEn,
                  labelId: item.labelId,
                  isOther: isOther(item.labelEn),
                  order: itemOrder,
                  isActive: true,
                },
              });
            } else {
              await prisma.hfacsNode.create({
                data: {
                  parentId: tier2Node.id,
                  section: sec.section,
                  depth: 2,
                  code: item.code,
                  labelEn: item.labelEn,
                  labelId: item.labelId,
                  isOther: isOther(item.labelEn),
                  order: itemOrder,
                  isActive: true,
                },
              });
            }
            itemCount += 1;
          }
        }
      }
    }

    console.log(
      `   ✅ Done: ${tier1Count} tier1, ${tier2Count} tier2, ${itemCount} items`,
    );
  } catch (error) {
    console.error('❌ Error seeding HFACS catalogue:', error);
    throw error;
  }
};

export default seedHfacsCatalogue;
