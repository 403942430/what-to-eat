interface TagProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Tag({ label, active = false, onClick, className = '' }: TagProps) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors
        ${active
          ? 'bg-orange-500 text-white'
          : 'bg-amber-50 text-gray-600'}
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}`}
      onClick={onClick}
    >
      {label}
    </span>
  );
}
