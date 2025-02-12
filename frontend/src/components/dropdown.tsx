'use client'

import React from 'react'

interface DropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange }) => {
  return (
    <div style={dropdownStyle}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        <option value="" disabled>
          Select an option
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
