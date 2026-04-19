/** Bilingual declaration statements (EN + Indonesian) shown on fill and detail. */
export const HEALTH_DECLARATION_TERMS = [
  {
    id: 'truth' as const,
    en: 'By signing this declaration letter, I declare that the answers provided in this letter are true.',
    idLang:
      'Dengan menandatangani surat pernyataan ini, saya menyatakan bahwa jawaban yang tertulis dalam surat ini adalah benar.',
  },
  {
    id: 'discipline' as const,
    en: 'I understand and accept that if it is proven that I have made any false statements in this letter, it may lead to disciplinary action that could affect my employment.',
    idLang:
      'Saya memahami dan menerima bahwa jika terbukti saya membuat pernyataan yang tidak benar pada surat ini, maka hal ini dapat mengarah pada tindakan disipliner yang akan berdampak pada pekerjaan saya.',
  },
] as const;
