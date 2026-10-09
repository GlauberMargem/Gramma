import type { ButtonHTMLAttributes } from 'react';
import { MaterialIcon } from './MaterialIcon';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  icon: string;
  label: string;
}

export function IconButton({ icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} className={className ? `icon-btn ${className}` : 'icon-btn'} aria-label={label} {...rest}>
      <MaterialIcon name={icon} />
    </button>
  );
}
