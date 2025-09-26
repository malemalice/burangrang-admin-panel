import { useParams } from 'react-router-dom';
import ChapterForm from '../pages/ChapterForm';

const EditChapterForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  return <ChapterForm mode="edit" courseId={courseId || ''} />;
};

export default EditChapterForm;
