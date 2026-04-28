import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { useTranslation } from 'react-i18next';

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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(displayValue ?? value);
  }, [displayValue, value]);

  const updateMenuPosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || results.length === 0) {
      setMenuPos(null);
      return;
    }
    updateMenuPosition();
  }, [isOpen, results, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen || results.length === 0) return;
    updateMenuPosition();

    const scrollableAncestors: (HTMLElement | Window)[] = [window];
    let p: HTMLElement | null = wrapperRef.current?.parentElement ?? null;
    while (p) {
      const { overflow, overflowY, overflowX } = getComputedStyle(p);
      if (/(auto|scroll|overlay)/.test(`${overflow}${overflowY}${overflowX}`)) {
        scrollableAncestors.push(p);
      }
      p = p.parentElement;
    }

    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    scrollableAncestors.forEach((node) =>
      node === window
        ? window.addEventListener('scroll', onScrollOrResize, true)
        : node.addEventListener('scroll', onScrollOrResize, true)
    );

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      scrollableAncestors.forEach((node) =>
        node === window
          ? window.removeEventListener('scroll', onScrollOrResize, true)
          : node.removeEventListener('scroll', onScrollOrResize, true)
      );
    };
  }, [isOpen, results.length, updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setIsOpen(false);
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
      {isOpen &&
        results.length > 0 &&
        menuPos &&
        createPortal(
          <ul
            ref={listRef}
            className="fixed z-[300] max-h-48 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
          >
            {results.map((item) => (
              <li
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
              >
                {item.label}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
};

interface DiagnosisTableProps {
  rows: DiagnosisFormRow[];
  onRowsChange: (rows: DiagnosisFormRow[]) => void;
}

export const DiagnosisTable = ({ rows, onRowsChange }: DiagnosisTableProps) => {
  const { t } = useTranslation();
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
                  aria-label={t('diagnosis.table.selectAll')}
                />
              </th>
              <th className="w-8 px-2 py-3 text-center font-medium text-gray-500">#</th>
              <th className="min-w-[200px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.icd10')}
              </th>
              <th className="min-w-[130px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.type')}
              </th>
              <th className="min-w-[100px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.case')}
              </th>
              <th className="min-w-[140px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.clinicalStatus')}
              </th>
              <th className="min-w-[150px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.verification')}
              </th>
              <th className="min-w-[130px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.onset')}
              </th>
              <th className="min-w-[180px] px-3 py-3 text-left font-medium text-gray-500">
                {t('diagnosis.table.columns.doctor')}
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
                  {t('diagnosis.table.empty.prefix')} <strong>{t('diagnosis.table.addRow')}</strong>{' '}
                  {t('diagnosis.table.empty.suffix')}
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
                      placeholder={t('diagnosis.table.placeholders.searchIcd10')}
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
                      placeholder={t('diagnosis.table.placeholders.diagnosisName')}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </td>

                {/* Jenis */}
                <td className="px-3 py-3">
                  {(() => {
                    const primaryTakenByAnotherRow = rows.some(
                      (r, rowIdx) => rowIdx !== index && r.type === 'primary'
                    );

                    return (
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(index, { type: e.target.value as DiagnosisType })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DIAGNOSIS_TYPE_OPTIONS.map((o) => (
                      <option
                        key={o.value}
                        value={o.value}
                        disabled={
                          o.value === 'primary' &&
                          primaryTakenByAnotherRow &&
                          row.type !== 'primary'
                        }
                      >
                        {o.label}
                      </option>
                    ))}
                  </select>
                    );
                  })()}
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
                    placeholder={t('diagnosis.table.placeholders.searchDoctor')}
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
          {t('diagnosis.table.addRow')}
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
            {t('diagnosis.table.removeSelected')} ({rows.filter((r) => r.selected).length})
          </button>
        )}
      </div>
    </div>
  );
};

export default DiagnosisTable;
