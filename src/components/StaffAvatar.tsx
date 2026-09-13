import React from 'react';
import { User } from 'lucide-react';
import { Profile } from '../types';

interface StaffAvatarProps {
  profile?: Partial<Profile> | null;
  employeeCode?: string;
  gender?: 'male' | 'female';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const isFemaleStaff = (code?: string, gender?: 'male' | 'female'): boolean => {
  if (gender === 'female') return true;
  if (!code) return false;
  const upper = code.trim().toUpperCase();
  return upper === 'A1078' || upper === 'A1241';
};

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  profile,
  employeeCode,
  gender,
  size = 'md',
  className = '',
}) => {
  const code = profile?.employee_code || employeeCode || '';
  const effGender = profile?.gender || gender;
  const female = isFemaleStaff(code, effGender);

  const sizeStyles = {
    xs: {
      container: 'w-6 h-6',
      icon: 'w-3.5 h-3.5',
    },
    sm: {
      container: 'w-7 h-7',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'w-9 h-9',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'w-11 h-11',
      icon: 'w-6 h-6',
    },
    xl: {
      container: 'w-14 h-14',
      icon: 'w-8 h-8',
    },
  }[size];

  // Nữ: icon nữ màu trắng nền hồng nhạt
  // Nam: icon nam màu trắng nền xanh dương
  const bgStyle = female
    ? 'bg-pink-300 text-white shadow-xs border border-pink-200'
    : 'bg-blue-500 text-white shadow-xs border border-blue-400';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none ${sizeStyles.container} ${bgStyle} ${className}`}
      title={profile?.full_name ? `${profile.full_name} (${code})` : code || '廚房同仁'}
    >
      <User className={`${sizeStyles.icon} text-white stroke-[2.4]`} />
      {/* Small subtle indicator dot */}
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold ${
          female ? 'bg-pink-500' : 'bg-blue-600'
        }`}
      />
    </div>
  );
};
