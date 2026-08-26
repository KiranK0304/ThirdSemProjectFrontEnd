import React from 'react';
import styles from './CompanyAvatar.module.css';

interface CompanyAvatarProps {
  name: string;
  size?: number;
}

const COLORS = [
  '#111111', '#374151', '#1E40AF', '#7E22CE',
  '#0F766E', '#B45309', '#B91C1C', '#4338CA',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({ name, size = 40 }) => {
  const initials = getInitials(name);
  const bgColor = getColor(name);

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.38,
        borderRadius: size * 0.2,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};
