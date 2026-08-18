import React from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: number;
  round?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 44, round = false, className = '', style, ...props }) => {
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const fontSize = size / 2.5;

  return (
    <div
      className={`${styles.avatar} ${round ? styles.round : ''} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        ...style,
      }}
      {...props}
    >
      {initials}
    </div>
  );
};
