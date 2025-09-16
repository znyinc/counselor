/**
 * Reusable form field component with validation and i18n support
 */

import React from 'react';
import './FormField.css';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldProps {
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'radio' | 'checkbox' | 'textarea';
  label: string;
  value: any;
  onChange: (name: string, value: any) => void;
  options?: FormFieldOption[];
  placeholder?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  min?: number;
  max?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  type,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  helpText,
  error,
  required = false,
  disabled = false,
  className = '',
  rows = 3,
  min,
  max,
}) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { value: inputValue, type: inputType } = e.target;
    
    if (inputType === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      onChange(name, checkbox.checked);
    } else if (inputType === 'number') {
      onChange(name, inputValue ? Number(inputValue) : '');
    } else {
      onChange(name, inputValue);
    }
  };

  const handleMultiSelectChange = (optionValue: string): void => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue];
    onChange(name, newValues);
  };

  const handleRadioChange = (optionValue: string): void => {
    onChange(name, optionValue);
  };

  const renderInput = (): JSX.Element => {
    const baseProps = {
      id: name,
      name,
      disabled,
      className: `form-input ${error ? 'error' : ''}`,
      'aria-describedby': helpText ? `${name}-help` : undefined,
      'aria-invalid': !!error,
    };

    switch (type) {
      case 'text':
        return (
          <input
            {...baseProps}
            type="text"
            value={value || ''}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
        );

      case 'number':
        return (
          <input
            {...baseProps}
            type="number"
            value={value || ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            min={min}
            max={max}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...baseProps}
            value={value || ''}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={rows}
          />
        );

      case 'select':
        return (
          <select
            {...baseProps}
            value={value || ''}
            onChange={handleInputChange}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="multiselect-container">
            {options.map(option => (
              <label key={option.value} className="multiselect-option">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={() => handleMultiSelectChange(option.value)}
                  disabled={disabled}
                />
                <span className="multiselect-label">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="radio-container">
            {options.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleRadioChange(option.value)}
                  disabled={disabled}
                />
                <span className="radio-label">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={!!value}
              onChange={handleInputChange}
              disabled={disabled}
            />
            <span className="checkbox-label">{label}</span>
          </label>
        );

      default:
        return <div>Unsupported field type: {type}</div>;
    }
  };

  return (
    <div className={`form-field ${className} ${error ? 'has-error' : ''}`}>
      {type !== 'checkbox' && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="form-input-container">
        {renderInput()}
      </div>

      {helpText && (
        <div id={`${name}-help`} className="form-help-text">
          {helpText}
        </div>
      )}

      {error && (
        <div className="form-error-text" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;