'use client'

import React from 'react'

interface DropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string  // Optional prop for custom placeholder text
  required?: boolean    // Optional prop for required validation
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',  // Default placeholder if none is provided
  required = false,  // Default to false if not provided
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

const dropdownStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
}

export default Dropdown