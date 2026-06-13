import React from 'react';
import { LESSON_CATALOG } from '../../../lib/lessonCatalog';
import { LessonClient } from './LessonClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return LESSON_CATALOG.map((lesson) => ({
    id: lesson.id,
  }));
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <LessonClient lessonId={id} />;
}
