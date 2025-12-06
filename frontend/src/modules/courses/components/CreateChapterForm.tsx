import { useParams } from 'react-router-dom';
import ChapterForm from '../pages/ChapterForm';

const CreateChapterForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  return <ChapterForm mode="create" courseId={courseId || ''} />;
};

export default CreateChapterForm;
