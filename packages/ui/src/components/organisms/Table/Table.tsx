import React from 'react';

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  emptyMessage?: string;
  className?: string;
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data available.',
  className = '',
}: TableProps<T>) {
  return (
    <div className={['overflow-x-auto rounded-lg border border-gray-800', className].join(' ')}>
      <table className="w-full text-sm text-gray-300">
        <thead className="bg-gray-800 text-xs uppercase text-gray-400">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={['px-4 py-3 font-medium', alignClasses[col.align ?? 'left']].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[rowKey])}
                className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={['px-4 py-3', alignClasses[col.align ?? 'left']].join(' ')}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
