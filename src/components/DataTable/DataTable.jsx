import React, { useState } from 'react';
import { HiOutlineSearch, HiOutlineInbox } from 'react-icons/hi';
import './DataTable.css';

export default function DataTable({ columns, data, searchPlaceholder = 'Search...' }) {
  const [search, setSearch] = useState('');

  const filtered = data.filter((row) =>
    columns.some((col) =>
      String(row[col.key] || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );

  return (
    <div className="glass-card data-table-wrapper">
      <div className="data-table-header">
        <div className="data-table-search">
          <HiOutlineSearch className="data-table-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="data-table-count">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <div className="data-table-empty">
                  <div className="data-table-empty-icon"><HiOutlineInbox /></div>
                  <strong>No data found</strong>
                  <p>Try adjusting your search or add new items</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
