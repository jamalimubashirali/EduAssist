import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Learning Assistant | EduAssist',
  description: 'Get personalized help with your studies from our AI tutor',
};

export default function LearningAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}