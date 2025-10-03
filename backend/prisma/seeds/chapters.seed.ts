import { PrismaClient, Course } from '@prisma/client';

export const chapters = [
  // Chapters for "Introduction to Cognitive Behavioral Therapy"
  {
    courseSlug: 'intro-cognitive-behavioral-therapy',
    chapters: [
      {
        title: 'Understanding CBT Fundamentals',
        description: 'Learn the core principles of Cognitive Behavioral Therapy, including the CBT triangle and how thoughts, feelings, and behaviors are interconnected.',
        order: 1,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/cbt-fundamentals.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'Identifying Cognitive Distortions',
        description: 'Learn to recognize common thinking errors like all-or-nothing thinking, catastrophizing, and mind reading that contribute to emotional distress.',
        order: 2,
        duration: 60,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/cognitive-distortions.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'Thought Challenging Techniques',
        description: 'Master evidence-based techniques for challenging negative thoughts and developing more balanced, realistic thinking patterns.',
        order: 3,
        duration: 75,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/thought-challenging.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'Behavioral Activation Strategies',
        description: 'Learn how to use behavioral techniques to improve mood and motivation through structured activity scheduling and goal setting.',
        order: 4,
        duration: 50,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/behavioral-activation.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'CBT Worksheets and Practice Exercises',
        description: 'Downloadable worksheets and practical exercises to reinforce your learning and apply CBT techniques in daily life.',
        order: 5,
        duration: 0,
        contentType: 'text',
        content: `# CBT Practice Worksheets

## Thought Record Worksheet
Use this worksheet to track and challenge negative thoughts:

| Situation | Automatic Thought | Emotion | Evidence For | Evidence Against | Balanced Thought |
|-----------|------------------|---------|--------------|------------------|------------------|
| | | | | | |

## Behavioral Activation Schedule
Plan activities that bring you joy and a sense of accomplishment:

### Morning Activities
- [ ] 
- [ ] 
- [ ] 

### Afternoon Activities
- [ ] 
- [ ] 
- [ ] 

### Evening Activities
- [ ] 
- [ ] 
- [ ] 

## Cognitive Distortion Checklist
Check which distortions you notice in your thinking:
- [ ] All-or-nothing thinking
- [ ] Catastrophizing
- [ ] Mind reading
- [ ] Fortune telling
- [ ] Labeling
- [ ] Should statements
- [ ] Emotional reasoning
- [ ] Discounting positives`,
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
    ],
  },
  // Chapters for "Advanced Mindfulness and Meditation Practices"
  {
    courseSlug: 'advanced-mindfulness-meditation',
    chapters: [
      {
        title: 'Foundations of Mindfulness',
        description: 'Understanding the core principles of mindfulness, present-moment awareness, and the science behind meditation practices.',
        order: 1,
        duration: 40,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/mindfulness-foundations.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Breathing Meditation Techniques',
        description: 'Learn various breathing meditation practices including basic breath awareness, counting breaths, and body scan techniques.',
        order: 2,
        duration: 55,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/breathing-meditation.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Loving-Kindness Meditation',
        description: 'Practice metta (loving-kindness) meditation to cultivate compassion, self-love, and positive emotions toward others.',
        order: 3,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/loving-kindness.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Walking Meditation and Mindful Movement',
        description: 'Learn to practice mindfulness through movement, including walking meditation, mindful yoga, and body awareness exercises.',
        order: 4,
        duration: 50,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/walking-meditation.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Integrating Mindfulness into Daily Life',
        description: 'Practical strategies for bringing mindfulness into everyday activities and maintaining a regular meditation practice.',
        order: 5,
        duration: 35,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/daily-mindfulness.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
    ],
  },
  // Chapters for "Trauma Recovery and Healing Fundamentals"
  {
    courseSlug: 'trauma-recovery-healing-fundamentals',
    chapters: [
      {
        title: 'Understanding Trauma and Its Impact',
        description: 'Learn about different types of trauma, how trauma affects the brain and body, and common trauma responses.',
        order: 1,
        duration: 50,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/trauma-understanding.mp4',
        isFree: true,
        isPublished: false,
      },
      {
        title: 'Building Safety and Stabilization',
        description: 'Essential techniques for creating internal and external safety, grounding exercises, and emotional regulation strategies.',
        order: 2,
        duration: 60,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/trauma-safety.mp4',
        isFree: false,
        isPublished: false,
      },
      {
        title: 'Processing and Integration Techniques',
        description: 'Evidence-based approaches for processing traumatic memories and integrating healing into daily life.',
        order: 3,
        duration: 70,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/trauma-processing.mp4',
        isFree: false,
        isPublished: false,
      },
    ],
  },
  // Chapters for "Anxiety Management and Coping Strategies"
  {
    courseSlug: 'anxiety-management-coping-strategies',
    chapters: [
      {
        title: 'Understanding Anxiety and Panic',
        description: 'Learn about different types of anxiety disorders, panic attacks, and the physiological responses to anxiety.',
        order: 1,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/anxiety-understanding.mp4',
        isFree: true,
        isPublished: false,
      },
      {
        title: 'Breathing Techniques for Anxiety Relief',
        description: 'Master breathing exercises including 4-7-8 breathing, box breathing, and diaphragmatic breathing for immediate anxiety relief.',
        order: 2,
        duration: 40,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/anxiety-breathing.mp4',
        isFree: false,
        isPublished: false,
      },
      {
        title: 'Progressive Muscle Relaxation',
        description: 'Learn systematic muscle relaxation techniques to reduce physical tension and promote calm.',
        order: 3,
        duration: 35,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/muscle-relaxation.mp4',
        isFree: false,
        isPublished: false,
      },
    ],
  },
  // Chapters for "Emotional Intelligence and Regulation"
  {
    courseSlug: 'emotional-intelligence-regulation',
    chapters: [
      {
        title: 'The Five Components of Emotional Intelligence',
        description: 'Introduction to self-awareness, self-regulation, motivation, empathy, and social skills in emotional intelligence.',
        order: 1,
        duration: 50,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/eq-components.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'Developing Self-Awareness',
        description: 'Learn to recognize and understand your own emotions, triggers, and emotional patterns.',
        order: 2,
        duration: 55,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/self-awareness.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'Emotional Regulation Strategies',
        description: 'Master techniques for managing intense emotions, including the STOP technique and emotional grounding exercises.',
        order: 3,
        duration: 60,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/emotional-regulation.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'Empathy and Social Skills',
        description: 'Develop empathy skills and learn effective communication techniques for better relationships.',
        order: 4,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/empathy-skills.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
    ],
  },
  // Chapters for "Sleep Wellness and Relaxation Techniques"
  {
    courseSlug: 'sleep-wellness-relaxation-techniques',
    chapters: [
      {
        title: 'Understanding Sleep and Its Importance',
        description: 'Learn about sleep cycles, the importance of quality sleep, and common sleep disorders.',
        order: 1,
        duration: 40,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/sleep-basics.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-03-15'),
      },
      {
        title: 'Sleep Hygiene Fundamentals',
        description: 'Essential sleep hygiene practices including bedroom environment, bedtime routines, and lifestyle factors.',
        order: 2,
        duration: 35,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/sleep-hygiene.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-15'),
      },
      {
        title: 'Guided Sleep Meditations',
        description: 'Relaxing guided meditations specifically designed to promote sleep and reduce insomnia.',
        order: 3,
        duration: 30,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/sleep-meditation.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-15'),
      },
      {
        title: 'Progressive Relaxation for Sleep',
        description: 'Step-by-step progressive muscle relaxation techniques to prepare your body and mind for restful sleep.',
        order: 4,
        duration: 25,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/sleep-relaxation.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-15'),
      },
    ],
  },
  // Chapters for "Building Healthy Relationships"
  {
    courseSlug: 'building-healthy-relationships',
    chapters: [
      {
        title: 'Foundations of Healthy Relationships',
        description: 'Learn the key components of healthy relationships including trust, respect, communication, and boundaries.',
        order: 1,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/relationship-foundations.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-04-01'),
      },
      {
        title: 'Effective Communication Skills',
        description: 'Master active listening, assertiveness, and conflict resolution techniques for better relationships.',
        order: 2,
        duration: 55,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/communication-skills.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-04-01'),
      },
      {
        title: 'Setting and Maintaining Boundaries',
        description: 'Learn to establish healthy boundaries, say no effectively, and protect your emotional well-being.',
        order: 3,
        duration: 40,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/healthy-boundaries.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-04-01'),
      },
    ],
  },
  // Chapters for "Addiction Recovery and Support"
  {
    courseSlug: 'addiction-recovery-support',
    chapters: [
      {
        title: 'Understanding Addiction and Recovery',
        description: 'Learn about the nature of addiction, the recovery process, and different pathways to healing.',
        order: 1,
        duration: 50,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/addiction-understanding.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-04-15'),
      },
      {
        title: 'Building a Support System',
        description: 'Learn how to build and maintain a strong support network during recovery.',
        order: 2,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/support-system.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-04-15'),
      },
      {
        title: 'Relapse Prevention Strategies',
        description: 'Develop skills and strategies to prevent relapse and maintain long-term recovery.',
        order: 3,
        duration: 60,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/relapse-prevention.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-04-15'),
      },
      {
        title: 'YouTube Integration: Guided Recovery Meditation',
        description: 'Example of embedding YouTube videos for guided recovery meditations and support content.',
        order: 4,
        duration: 20,
        contentType: 'youtube',
        youtubeVideoId: 'dQw4w9WgXcQ', // Example YouTube video ID
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-04-15'),
      },
    ],
  },
];

export async function seedChapters(prisma: PrismaClient, courses: Course[]): Promise<any[]> {
  console.log('🌱 Creating mental health course chapters...');
  
  try {
    let totalChapters = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const courseChapters of chapters) {
      try {
        const course = courses.find(c => c.slug === courseChapters.courseSlug);
        
        if (!course) {
          console.warn(`⚠️  Course with slug ${courseChapters.courseSlug} not found, skipping chapters`);
          continue;
        }

        const createdChapters = await Promise.all(
          courseChapters.chapters.map(async (chapterData) => {
            const chapter = await prisma.chapter.create({
              data: {
                courseId: course.id,
                title: chapterData.title,
                description: chapterData.description,
                order: chapterData.order,
                duration: chapterData.duration,
                contentType: chapterData.contentType,
                contentUrl: chapterData.contentUrl,
                youtubeVideoId: chapterData.youtubeVideoId,
                content: chapterData.content,
                isFree: chapterData.isFree,
                isPublished: chapterData.isPublished,
                publishedAt: chapterData.publishedAt,
              },
            });

            return chapter;
          })
        );

        // Update course with chapter count and total duration
        const totalDuration = courseChapters.chapters.reduce((sum, chapter) => sum + chapter.duration, 0);
        await prisma.course.update({
          where: { id: course.id },
          data: {
            totalChapters: createdChapters.length,
            totalDuration: totalDuration,
          },
        });

        console.log(`✅ Created ${createdChapters.length} chapters for course: ${course.title}`);
        totalChapters += createdChapters.length;
        successCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to create chapters for course ${courseChapters.courseSlug}:`, errorMessage);
        errorCount++;
      }
    }

    console.log(`🎉 Created ${totalChapters} mental health chapters successfully! Success: ${successCount}, Errors: ${errorCount}`);
    
    // Return all chapters
    return await prisma.chapter.findMany();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Chapters seeding failed:', errorMessage);
    throw error;
  }
}