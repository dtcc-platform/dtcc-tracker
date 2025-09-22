'use client'

import React, { CSSProperties } from 'react'
import { palette } from '@/app/theme'

interface DropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  required = false,
}) => {
  return (
    <div style={dropdownStyle}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

const dropdownStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
}

const selectStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: '1px solid rgba(15, 33, 63, 0.16)',
  backgroundColor: '#ffffff',
  color: palette.deepNavy,
  fontSize: '15px',
  appearance: 'none',
  outline: 'none',
  backgroundImage:
    'linear-gradient(45deg, transparent 50%, rgba(15, 33, 63, 0.35) 50%),' +
    'linear-gradient(135deg, rgba(15, 33, 63, 0.35) 50%, transparent 50%)',
  backgroundPosition: 'calc(100% - 18px) calc(50% - 3px), calc(100% - 13px) calc(50% - 3px)',
  backgroundSize: '6px 6px, 6px 6px',
  backgroundRepeat: 'no-repeat',
}

export default Dropdown
