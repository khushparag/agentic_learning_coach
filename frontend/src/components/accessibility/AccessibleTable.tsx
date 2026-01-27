import React, { useState } from 'react';
import { useKeyboardNavigation } from '../../hooks/useAccessibility';
import { useAccessibilityAware } from '../../contexts/AccessibilityContext';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  ArrowsUpDownIcon 
} from '@heroicons/react/24/outline';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  'aria-label'?: string;
}

export interface AccessibleTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  caption?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  getRowId?: (row: T, index: number) => string | number;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

function AccessibleTable<T = any>({
  data,
  columns,
  caption,
  sortBy,
  sortDirection = 'asc',
  onSort,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  getRowId = (_, index) => index,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: AccessibleTableProps<T>) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const { containerRef } = useKeyboardNavigation({
    orientation: 'both',
    wrap: false,
    itemSelector: 'td[tabindex="0"], th[tabindex="0"]'
  });
  const tableRef = containerRef as React.RefObject<HTMLTableElement>;
  
  const { getFocusClass, announce } = useAccessibilityAware();

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
    
    const column = columns.find(col => col.key === columnKey);
    announce(
      `Table sorted by ${column?.header} in ${newDirection}ending order`,
      'polite'
    );
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    const allSelected = selectedRows.size === data.length;
    const newSelection = new Set<string | number>();
    
    if (!allSelected) {
      data.forEach((row, index) => {
        newSelection.add(getRowId(row, index));
      });
    }
    
    onSelectionChange(newSelection);
    announce(
      allSelected ? 'All rows deselected' : 'All rows selected',
      'polite'
    );
  };

  const handleRowSelect = (rowId: string | number) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    
    onSelectionChange(newSelection);
  };

  const getCellValue = (row: T, column: TableColumn<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    const value = row[column.accessor];
    // Convert value to ReactNode-compatible type
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (React.isValidElement(value)) return value;
    return String(value);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-primary-600" />
      : <ChevronDownIcon className="w-4 h-4 text-primary-600" />;
  };

  const focusClass = getFocusClass();

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table 
        ref={tableRef}
        className="table-accessible min-w-full divide-y divide-gray-200"
        role="table"
        aria-label={ariaLabel || caption}
        aria-describedby={ariaDescribedBy}
        aria-rowcount={data.length + 1} // +1 for header
        aria-colcount={columns.length + (selectable ? 1 : 0)}
      >
        {caption && (
          <caption className="sr-only">
            {caption}
          </caption>
        )}
        
        <thead className="bg-gray-50">
          <tr role="row" aria-rowindex={1}>
            {selectable && (
              <th 
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${focusClass}`}
                role="columnheader"
                aria-colindex={1}
              >
                <input
                  type="checkbox"
                  className={`h-4 w-4 text-primary-600 border-gray-300 rounded ${focusClass}`}
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : 'text-left'}
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                  ${focusClass}
                `}
                style={{ width: column.width }}
                role="columnheader"
                aria-colindex={index + (selectable ? 2 : 1)}
                aria-sort={
                  sortBy === column.key 
                    ? sortDirection === 'asc' ? 'ascending' : 'descending'
                    : column.sortable ? 'none' : undefined
                }
                tabIndex={column.sortable ? 0 : -1}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                onKeyDown={(e) => {
                  if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSort(column.key);
                  }
                }}
                aria-label={column['aria-label'] || `${column.header}${column.sortable ? ', sortable' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <span aria-hidden="true">
                      {getSortIcon(column.key)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => {
            const rowId = getRowId(row, rowIndex);
            const isSelected = selectedRows.has(rowId);
            
            return (
              <tr 
                key={rowId}
                role="row"
                aria-rowindex={rowIndex + 2}
                aria-selected={selectable ? isSelected : undefined}
                className={`
                  hover:bg-gray-50 transition-colors
                  ${isSelected ? 'bg-primary-50' : ''}
                `}
              >
                {selectable && (
                  <td 
                    className={`px-6 py-4 whitespace-nowrap ${focusClass}`}
                    role="gridcell"
                    aria-colindex={1}
                  >
                    <input
                      type="checkbox"
                      className={`h-4 w-4 text-primary-600 border-gray-300 rounded ${focusClass}`}
                      checked={isSelected}
                      onChange={() => handleRowSelect(rowId)}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </td>
                )}
                
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm text-gray-900
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : 'text-left'}
                      ${focusClass}
                    `}
                    role="gridcell"
                    aria-colindex={colIndex + (selectable ? 2 : 1)}
                    tabIndex={0}
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No data available</p>
        </div>
      )}
      
      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        <p>
          Table with {data.length} rows and {columns.length} columns.
          {selectable && selectedRows.size > 0 && (
            <span> {selectedRows.size} rows selected.</span>
          )}
          {sortBy && (
            <span> Sorted by {columns.find(col => col.key === sortBy)?.header} in {sortDirection}ending order.</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default AccessibleTable;