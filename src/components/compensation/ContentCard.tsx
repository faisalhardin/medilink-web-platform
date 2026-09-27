import type { ReactNode } from 'react';

type ContentCardProps = {
  children: ReactNode;
};

const ContentCard = ({ children }: ContentCardProps) => (
  <div className="overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_40px_rgba(13,27,42,0.08)] sm:p-6">
    {children}
  </div>
);

export default ContentCard;
