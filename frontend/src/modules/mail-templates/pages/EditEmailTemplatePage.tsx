import { useParams } from 'react-router-dom';
import { useEmailTemplate } from '../hooks/useEmailTemplates';
import EmailTemplateForm from './EmailTemplateForm';
import PageHeader from '@/core/components/ui/PageHeader';

const EditEmailTemplatePage = () => {
  const { templateId } = useParams();
  const { template, isLoading } = useEmailTemplate(templateId || null);

  return (
    <>
      <PageHeader title="Edit Email Template" />
      {!isLoading && <EmailTemplateForm template={template || undefined} mode="edit" />}
    </>
  );
};

export default EditEmailTemplatePage;


