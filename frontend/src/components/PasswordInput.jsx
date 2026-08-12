import { useState } from 'react';
import Icon from './ui/icons';

const PasswordInput = ({ value, onChange, placeholder, className = '', label, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        className={`input-base pr-11 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center"
      >
        {showPassword ? <Icon.eyeOff className="w-5 h-5" /> : <Icon.eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PasswordInput;
