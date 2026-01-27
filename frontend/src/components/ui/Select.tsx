import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  helperText,
  disabled = false,
  fullWidth = false,
  className = '',
}) => {
  const selectedOption = options.find(option => option.value === value);

  const selectClasses = [
    'input cursor-pointer',
    error ? 'input-error' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button className={selectClasses}>
            <span className="flex items-center">
              {selectedOption?.icon && (
                <span className="w-4 h-4 mr-2">{selectedOption.icon}</span>
              )}
              <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </span>
            
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {error ? (
                <ExclamationCircleIcon className="w-4 h-4 text-error-500" />
              ) : (
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
              )}
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-medium ring-1 ring-black ring-opacity-5 focus:outline-none">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active, disabled: optionDisabled }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                    } ${optionDisabled ? 'opacity-50 cursor-not-allowed' : ''}`
                  }
                  value={option.value}
                  disabled={option.disabled}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        {option.icon && (
                          <span className="w-4 h-4 mr-2">{option.icon}</span>
                        )}
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                      </div>
                      
                      {selected && (
                        <span
                          className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                            active ? 'text-primary-600' : 'text-primary-600'
                          }`}
                        >
                          <CheckIcon className="w-4 h-4" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export { Select };
export default Select;
