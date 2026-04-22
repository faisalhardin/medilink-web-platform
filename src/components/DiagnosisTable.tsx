import { useState, useRef, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import {
  DiagnosisFormRow,
  ICD10Option,
  DoctorOption,
  DiagnosisType,
  DiagnosisCase,
  ClinicalStatus,
  VerificationStatus,
  DIAGNOSIS_TYPE_OPTIONS,
  DIAGNOSIS_CASE_OPTIONS,
  CLINICAL_STATUS_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
  emptyDiagnosisRow,
} from '@models/diagnosis';
import { searchICD10, searchDoctors } from '@requests/diagnosis';

interface SearchComboboxProps {
  value: string;
  placeholder: string;
  onSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  onSelect: (id: string, label: string) => void;
  displayValue?: string;
  disabled?: boolean;
}

const SearchCombobox = ({
  value,
  placeholder,
  onSearch,
  onSelect,
  displayValue,
  disabled,
}: SearchComboboxProps) => {
  const [query, setQuery] = useState(displayValue ?? value);
  const [results, setResults] = useState<{ id: string; label: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(displayValue ?? value);
  }, [displayValue, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      const found = await onSearch(q);
      setResults(found);
      setIsOpen(found.length > 0);
      setIsLoading(false);
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    debouncedSearch(q);
  };

  const handleSelect = (item: { id: string; label: string }) => {
    setQuery(item.label);
    setIsOpen(false);
    onSelect(item.id, item.label);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {results.map((item) => (
            <li
              key={item.id}
              onMouseDown={() => handleSelect(item)}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface DiagnosisTableProps {
  rows: DiagnosisFormRow[];
  onRowsChange: (rows: DiagnosisFormRow[]) => void;
}

export const DiagnosisTable = ({ rows, onRowsChange }: DiagnosisTableProps) => {
  const updateRow = (index: number, patch: Partial<DiagnosisFormRow>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onRowsChange(next);
  };

  const addRow = () => {
    onRowsChange([...rows, emptyDiagnosisRow()]);
  };

  const removeSelected = () => {
    onRowsChange(rows.filter((r) => !r.selected));
  };

  const toggleSelect = (index: number) => {
    updateRow(index, { selected: !rows[index].selected });
  };

  const toggleSelectAll = () => {
    const allSelected = rows.every((r) => r.selected);
    onRowsChange(rows.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleICD10Search = async (q: string) => {
    const results = await searchICD10(q);
    return results.map((r: ICD10Option) => ({
      id: r.code,
      label: `${r.code} — ${r.display}`,
    }));
  };

  const handleDoctorSearch = async (q: string) => {
    const results = await searchDoctors(q);
    return results.map((r: DoctorOption) => ({ id: r.id, label: r.name }));
  };

  const hasSelected = rows.some((r) => r.selected);
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Pilih semua"
                />
              </th>
              <th className="w-8 px-2 py-3 text-center font-medium text-gray-500">#</th>
              <th className="min-w-[200px] px-3 py-3 text-left font-medium text-gray-500">
                ICD-10 / Diagnosa
              </th>
              <th className="min-w-[130px] px-3 py-3 text-left font-medium text-gray-500">
                Jenis
              </th>
              <th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500">
                Kasus
              </th>
              <th className="min-w-[140px] px-3 py-3 text-left font-medium text-gray-500">
                Status Klinis
              </th>
              <th className="min-w-[150px] px-3 py-3 text-left font-medium text-gray-500">
                Verifikasi
              </th>
              <th className="min-w-[130px] px-3 py-3 text-left font-medium text-gray-500">
                Onset
              </th>
              <th className="min-w-[180px] px-3 py-3 text-left font-medium text-gray-500">
                Dokter
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-10 text-center text-sm text-gray-400"
                >
                  Belum ada diagnosa. Klik <strong>+ Tambah Baris</strong> untuk memulai.
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr
                key={index}
                className={row.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}
              >
                {/* Checkbox */}
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleSelect(index)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                {/* Row number */}
                <td className="px-2 py-3 text-center text-gray-400">{index + 1}</td>

                {/* ICD-10 + Nama Diagnosa */}
                <td className="px-3 py-3">
                  <div className="space-y-1.5">
                    <SearchCombobox
                      value={row.icd10_code}
                      displayValue={row.icd10_code ? `${row.icd10_code}` : ''}
                      placeholder="Cari kode ICD-10..."
                      onSearch={handleICD10Search}
                      onSelect={(code, label) => {
                        const display = label.includes('—')
                          ? label.split('—')[1].trim()
                          : label;
                        updateRow(index, { icd10_code: code, icd10_display: display });
                      }}
                    />
                    <input
                      type="text"
                      value={row.icd10_display}
                      onChange={(e) => updateRow(index, { icd10_display: e.target.value })}
                      placeholder="Nama diagnosa..."
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </td>

                {/* Jenis */}
                <td className="px-3 py-3">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(index, { type: e.target.value as DiagnosisType })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DIAGNOSIS_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Kasus */}
                <td className="px-3 py-3">
                  <select
                    value={row.case}
                    onChange={(e) => updateRow(index, { case: e.target.value as DiagnosisCase })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DIAGNOSIS_CASE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Status Klinis */}
                <td className="px-3 py-3">
                  <select
                    value={row.clinical_status}
                    onChange={(e) =>
                      updateRow(index, { clinical_status: e.target.value as ClinicalStatus })
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {CLINICAL_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Verifikasi */}
                <td className="px-3 py-3">
                  <select
                    value={row.verification_status}
                    onChange={(e) =>
                      updateRow(index, {
                        verification_status: e.target.value as VerificationStatus,
                      })
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {VERIFICATION_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Onset Date */}
                <td className="px-3 py-3">
                  <input
                    type="date"
                    value={row.onset_date}
                    onChange={(e) => updateRow(index, { onset_date: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                {/* Dokter */}
                <td className="px-3 py-3">
                  <SearchCombobox
                    value={row.doctor_id}
                    displayValue={row.doctor_name}
                    placeholder="Cari dokter..."
                    onSearch={handleDoctorSearch}
                    onSelect={(id, name) => updateRow(index, { doctor_id: id, doctor_name: name })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table action bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Baris
        </button>

        {hasSelected && (
          <button
            type="button"
            onClick={removeSelected}
            className="flex items-center gap-1.5 rounded-md border border-red-500 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Hapus Terpilih ({rows.filter((r) => r.selected).length})
          </button>
        )}
      </div>
    </div>
  );
};

export default DiagnosisTable;
