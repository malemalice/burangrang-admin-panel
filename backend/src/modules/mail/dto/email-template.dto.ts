export class EmailTemplateDto {
  id: string;
  code: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EmailTemplateDto>) {
    Object.assign(this, partial);
  }
}


