import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import debounce from 'lodash.debounce';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ProcedureFormRow,
  ProcedureProductOption,
  ICD9CMOption,
  ProcedureCategory,
  PROCEDURE_CATEGORY_OPTIONS,
  DoctorOption,
  NurseOption,
  emptyProcedureRow,
} from '@models/procedure';
import { searchProcedureProducts, searchICD9CM } from '@requests/procedure';
import { searchDoctors } from '@requests/diagnosis';
import { searchNurses } from '@requests/anamnesa';
import { useTranslation } from 'react-i18next';

interface SearchComboboxProps {
  value: string;
  placeholder: string;
  onSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  onSelect: (id: string, label: string) => void;
  displayValue?: string;
  disabled?: boolean;
}

/**
 * Search combobox with a chip-mode to prevent misleading UX.
 *
 * When `value` (the backing ID) is non-empty the component renders a read-only
 * chip with an × button.  The user must explicitly press × to clear the
 * selection — typing in the search box can never accidentally orphan a
 * selected ID.
 */
const SearchCombobox = ({
  value,
  placeholder,
  onSearch,
  onSelect,
  displayValue,
  disabled,
}: SearchComboboxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; label: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset search input whenever the selection is cleared from outside.
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

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
    setQuery('');
    setIsOpen(false);
    onSelect(item.id, item.label);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect('', '');
  };

  // ── Chip mode: a value is confirmed selected ──────────────────────────────
  if (value) {
    const chipLabel = displayValue || value;
    return (
      <div className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1.5">
        <span className="flex-1 truncate text-sm text-gray-800" title={chipLabel}>
          {chipLabel}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 flex-shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
            aria-label="Clear selection"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // ── Search mode: no value selected yet ───────────────────────────────────
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

// ─── Sortable row group ───────────────────────────────────────────────────────
// Each procedure row is wrapped in its own <tbody> so that both the main row
// and the optional expanded-detail row move together during drag.

interface SortableRowGroupProps {
  row: ProcedureFormRow;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<ProcedureFormRow>) => void;
  onToggleSelect: () => void;
  handleProductSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  handleICD9CMSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  handleDoctorSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  handleNurseSearch: (q: string) => Promise<{ id: string; label: string }[]>;
  t: (key: string) => string;
}

const SortableRowGroup = ({
  row,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onToggleSelect,
  handleProductSearch,
  handleICD9CMSearch,
  handleDoctorSearch,
  handleNurseSearch,
  t,
}: SortableRowGroupProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.dndId,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <tbody ref={setNodeRef} style={style}>
      <tr className={row.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
        {/* Drag handle */}
        <td className="w-5 px-1 py-3 text-center">
          <button
            type="button"
            className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing px-1"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a1 1 0 100-2 1 1 0 000 2zM13 4a1 1 0 100-2 1 1 0 000 2zM7 8a1 1 0 100-2 1 1 0 000 2zM13 8a1 1 0 100-2 1 1 0 000 2zM7 12a1 1 0 100-2 1 1 0 000 2zM13 12a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          </button>
        </td>

        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={row.selected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
        <td className="px-2 py-3 text-center text-gray-400">{index + 1}</td>

        <td className="px-3 py-3">
          <select
            value={row.category}
            onChange={(e) => onUpdate({ category: e.target.value as ProcedureCategory | '' })}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{t('procedure.table.placeholders.selectCategory')}</option>
            {PROCEDURE_CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </td>

        <td className="px-3 py-3">
          <SearchCombobox
            value={row.icd9cm_code}
            displayValue={
              row.icd9cm_code && row.icd9cm_display
                ? `${row.icd9cm_code} — ${row.icd9cm_display}`
                : row.icd9cm_code
            }
            placeholder={t('procedure.table.placeholders.searchIcd9cm')}
            onSearch={handleICD9CMSearch}
            onSelect={(code, label) => {
              if (code === '') {
                onUpdate({ icd9cm_code: '', icd9cm_display: '' });
                return;
              }
              const display = label.includes('—') ? label.split('—')[1].trim() : label;
              onUpdate({ icd9cm_code: code, icd9cm_display: display });
            }}
          />
        </td>

        <td className="px-3 py-3">
          <SearchCombobox
            value={row.doctor_id}
            displayValue={row.doctor_name}
            placeholder={t('procedure.table.placeholders.searchDoctor')}
            onSearch={handleDoctorSearch}
            onSelect={(id, name) => onUpdate({ doctor_id: id, doctor_name: name })}
          />
        </td>

        <td className="px-3 py-3">
          <SearchCombobox
            value={row.product_id ? String(row.product_id) : ''}
            displayValue={row.product_name}
            placeholder={t('procedure.table.placeholders.searchProduct')}
            onSearch={handleProductSearch}
            onSelect={(id, name) =>
              onUpdate({ product_id: id === '' ? null : Number(id), product_name: name })
            }
          />
        </td>

        <td className="px-2 py-3 text-center">
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={t('procedure.table.toggleDetails')}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-gray-50/60">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('procedure.detail.plannedAt')}
                </label>
                <input
                  type="datetime-local"
                  value={row.planned_at}
                  onChange={(e) => onUpdate({ planned_at: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('procedure.detail.duration')}
                </label>
                <input
                  type="text"
                  value={row.duration}
                  onChange={(e) => onUpdate({ duration: e.target.value })}
                  placeholder={t('procedure.detail.durationPlaceholder')}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('procedure.detail.nurse')}
                </label>
                <SearchCombobox
                  value={row.nurse_id}
                  displayValue={row.nurse_name}
                  placeholder={t('procedure.detail.searchNurse')}
                  onSearch={handleNurseSearch}
                  onSelect={(id, name) => onUpdate({ nurse_id: id, nurse_name: name })}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('procedure.detail.description')}
                </label>
                <textarea
                  value={row.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder={t('procedure.detail.descriptionPlaceholder')}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('procedure.detail.notes')}
                </label>
                <textarea
                  value={row.notes}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  placeholder={t('procedure.detail.notesPlaceholder')}
                  rows={2}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
};

// ─── ProcedureTable ───────────────────────────────────────────────────────────

interface ProcedureTableProps {
  rows: ProcedureFormRow[];
  onRowsChange: (rows: ProcedureFormRow[]) => void;
}

export const ProcedureTable = ({ rows, onRowsChange }: ProcedureTableProps) => {
  const { t } = useTranslation();
  // Track expanded rows by dndId so state is stable across reorders.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateRow = (dndId: string, patch: Partial<ProcedureFormRow>) => {
    onRowsChange(rows.map((r) => (r.dndId === dndId ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    onRowsChange([...rows, emptyProcedureRow()]);
  };

  const removeSelected = () => {
    onRowsChange(rows.filter((r) => !r.selected));
  };

  const toggleSelect = (dndId: string) => {
    onRowsChange(rows.map((r) => (r.dndId === dndId ? { ...r, selected: !r.selected } : r)));
  };

  const toggleSelectAll = () => {
    const allSelected = rows.every((r) => r.selected);
    onRowsChange(rows.map((r) => ({ ...r, selected: !allSelected })));
  };

  const toggleExpand = (dndId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(dndId) ? next.delete(dndId) : next.add(dndId);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.dndId === active.id);
    const newIndex = rows.findIndex((r) => r.dndId === over.id);
    onRowsChange(arrayMove(rows, oldIndex, newIndex));
  };

  const handleProductSearch = async (q: string) => {
    const results = await searchProcedureProducts(q);
    return results.map((r: ProcedureProductOption) => ({ id: String(r.id), label: r.name }));
  };

  const handleICD9CMSearch = async (q: string) => {
    const results = await searchICD9CM(q);
    return results.map((r: ICD9CMOption) => ({ id: r.code, label: `${r.code} — ${r.display}` }));
  };

  const handleDoctorSearch = async (q: string) => {
    const results = await searchDoctors(q);
    return results.map((r: DoctorOption) => ({ id: r.id, label: r.name }));
  };

  const handleNurseSearch = async (q: string) => {
    const results = await searchNurses(q);
    return results.map((r: NurseOption) => ({ id: r.id, label: r.name }));
  };

  const hasSelected = rows.some((r) => r.selected);
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-5 px-1 py-3" aria-label="drag handle" />
              <th className="w-8 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={t('procedure.table.selectAll')}
                />
              </th>
              <th className="w-8 px-2 py-3 text-center font-medium text-gray-500">#</th>
              <th className="min-w-[170px] px-3 py-3 text-left font-medium text-gray-500">
                {t('procedure.table.columns.category')}
              </th>
              <th className="min-w-[180px] px-3 py-3 text-left font-medium text-gray-500">
                {t('procedure.table.columns.icd9cm')}
                <span className="ml-0.5 text-red-500">*</span>
              </th>
              <th className="min-w-[180px] px-3 py-3 text-left font-medium text-gray-500">
                {t('procedure.table.columns.doctor')}
                <span className="ml-0.5 text-red-500">*</span>
              </th>
              <th className="min-w-[220px] px-3 py-3 text-left font-medium text-gray-500">
                {t('procedure.table.columns.product')}
              </th>
              <th className="w-12 px-2 py-3" aria-label="expand" />
            </tr>
          </thead>

          {rows.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-gray-400">
                  {t('procedure.table.empty.prefix')}{' '}
                  <strong>{t('procedure.table.addRow')}</strong>{' '}
                  {t('procedure.table.empty.suffix')}
                </td>
              </tr>
            </tbody>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rows.map((r) => r.dndId)}
              strategy={verticalListSortingStrategy}
            >
              {rows.map((row, index) => (
                <SortableRowGroup
                  key={row.dndId}
                  row={row}
                  index={index}
                  isExpanded={expanded.has(row.dndId)}
                  onToggleExpand={() => toggleExpand(row.dndId)}
                  onUpdate={(patch) => updateRow(row.dndId, patch)}
                  onToggleSelect={() => toggleSelect(row.dndId)}
                  handleProductSearch={handleProductSearch}
                  handleICD9CMSearch={handleICD9CMSearch}
                  handleDoctorSearch={handleDoctorSearch}
                  handleNurseSearch={handleNurseSearch}
                  t={t}
                />
              ))}
            </SortableContext>
          </DndContext>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('procedure.table.addRow')}
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
            {t('procedure.table.removeSelected')} ({rows.filter((r) => r.selected).length})
          </button>
        )}
      </div>
    </div>
  );
};

export default ProcedureTable;
