interface GenderBadgeProps {
  sex?: string;
}

const GenderBadge = ({ sex }: GenderBadgeProps) => {
  if (!sex) return null;
  const normalizedSex = sex.toLowerCase();

  if (normalizedSex === "male") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">♂</span>;
  } else if (normalizedSex === "female") {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">♀</span>;
  }

  return null;
};

export default GenderBadge;
