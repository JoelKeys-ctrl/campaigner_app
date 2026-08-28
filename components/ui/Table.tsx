import React from 'react';

interface TableHeader<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  headers: TableHeader<T>[];
  data: T[];
  className?: string;
  rowClassName?: (item: T) => string;
}

const Table = <T extends Record<string, any>>({ headers, data, className = '', rowClassName }: TableProps<T>) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {headers.map((header) => (
              <th key={String(header.key)} scope="col" className="px-6 py-3">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-500 ${rowClassName ? rowClassName(item) : ''}`}>
              {headers.map((header) => (
                <td key={`${String(header.key)}-${item.id || index}`} className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {header.render ? header.render(item) : item[header.key as keyof T]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
