# Wage settings

- Route `/payroll/wages`. Payroll shell requires `compensation.read`. The wages route, payday button, and Staff header link require `compensation.manage`. Administrator bypasses both.
- Client: `requests/compensationWage.ts`. Path constant `COMPENSATION_WAGE_PATH` = `/v1/compensation/wages`. Types: `StaffWage` in `models/compensation.ts` (JSON snake_case).
- Cadence: `monthly` | `weekly` | `daily` (`WAGE_CADENCES`).
- `GET` returns **active** wages only. `created_at` is RFC3339. The list sorts oldest `created_at` first (id if missing), shows 10, then the next 10. Staff names come from `ListStaff`, not the wage row.
- `PUT` always inserts a new active row. If one active wage exists, the API closes it the day before the new `effective_from`. Reusing that start date returns `WAGE_EFFECTIVE_RANGE_OVERLAP`. `effective_to` null means open-ended.
- UI (`components/compensation/WageConfig.tsx`): Contracts and the form are separate tabs, not one view. List min-height tracks the form. Checkbox "until I change it later" clears the end date. Update locks the staff field and prefills the current contract. Saving still replaces the contract; the new start must be after the current start.
- Wage `error_name` values mapped to en/id in that component: `INVALID_WAGE_CADENCE`, `WAGE_EFFECTIVE_RANGE_INVALID`, `WAGE_EFFECTIVE_RANGE_OVERLAP`, `WAGE_MULTIPLE_ACTIVE`, `WAGE_NOT_FOUND`. Unknown text falls through `getApiErrorMessage`. Non-401 4xx also open `ApiErrorReport`.
- Payday period totals do not include wages yet. Do not add a client warning that wage dates overlap a payday period.
