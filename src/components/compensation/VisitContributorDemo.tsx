// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Lock,
  PersonAdd,
  DeleteOutline,
} from '@mui/icons-material';
import { useCompensationMock } from 'context/CompensationMockContext';
import { MOCK_STAFF_OPTIONS } from 'mocks/compensationMock';
import { formatSourceChip, sourceTypeColor } from '@utils/compensationSources';

/**
 * Standalone mock of the Visit Contributor Panel (Panel Kontributor Kunjungan).
 * Split of duties: this panel = who is on the visit for pay; payday = how much.
 */
const VisitContributorDemo = () => {
  const navigate = useNavigate();
  const {
    contributors,
    visitLocked,
    setVisitLocked,
    addContributor,
    removeContributor,
  } = useCompensationMock();

  const [selected, setSelected] = useState<{
    staff_id: string;
    name: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const available = MOCK_STAFF_OPTIONS.filter(
    (s) => !contributors.some((c) => c.staff_id === s.staff_id)
  );

  const handleAdd = () => {
    if (!selected) return;
    if (visitLocked) {
      setToast('Visit is locked — non-admins cannot add contributors. (Admin override would audit.)');
      return;
    }
    addContributor(selected.staff_id, selected.name);
    setSelected(null);
    setToast(`${selected.name} added as manual contributor`);
  };

  return (
    <div className="flex-1 p-6 w-full space-y-6 max-w-3xl">
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <strong>UX Mock · Option A</strong> — Panel sets <em>who</em> is eligible (sources).
        Commission % / flat is assigned on payday against the <em>full visit cart</em>. Toggle lock
        to simulate finalize.
      </Alert>

      {toast && (
        <Alert
          severity={toast.includes('locked') ? 'warning' : 'success'}
          onClose={() => setToast(null)}
          sx={{ borderRadius: 2 }}
        >
          {toast}
        </Alert>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/payroll')}
            size="small"
            sx={{ mb: 2 }}
          >
            Back to payroll
          </Button>

          {/* Fake visit header */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  Visit · Ahmad Fauzi
                </h1>
                {visitLocked && (
                  <Chip
                    icon={<Lock />}
                    size="small"
                    color="warning"
                    label="Compensation locked"
                  />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                5 Aug 2026 · Demo visit (not a real record)
              </p>
            </div>
            <FormControlLabel
              control={
                <Switch
                  checked={visitLocked}
                  onChange={(e) => setVisitLocked(e.target.checked)}
                  size="small"
                />
              }
              label={
                <span className="text-sm text-gray-600">Simulate finalized lock</span>
              }
            />
          </div>

          {/* Contributor panel */}
          <Paper
            variant="outlined"
            sx={{ p: 3, borderRadius: 2, bgcolor: visitLocked ? 'grey.50' : 'background.paper' }}
          >
            <div className="flex items-center justify-between mb-1">
              <Typography variant="subtitle1" fontWeight={600}>
                Panel Kontributor Kunjungan
              </Typography>
              {visitLocked && (
                <Chip size="small" icon={<Lock />} label="Read-only for non-admin" />
              )}
            </div>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Eligibility only — clinical sources auto-detect; add clerks for special commission.
              Does not set commission amount (done on payday against visit total).
            </Typography>

            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 mb-4">
              <Typography variant="caption" color="text.secondary" display="block">
                Visit total (full cart) — context only here
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                Rp 1.200.000
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Same base for every staff on this visit when assigning % on payday
              </Typography>
            </div>

            <div className="space-y-2 mb-4">
              {contributors.map((c) => (
                <Box
                  key={c.staff_id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 bg-white"
                >
                  <div>
                    <Typography variant="body2" fontWeight={600}>
                      {c.name}
                    </Typography>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <Chip
                        size="small"
                        label={formatSourceChip(c.source)}
                        color={sourceTypeColor(c.source.type)}
                        variant="outlined"
                        sx={{ height: 20, fontSize: 11 }}
                      />
                      {c.added_manually ? (
                        <Chip
                          size="small"
                          label="Manual"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Clinical"
                          color="default"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                    </div>
                  </div>
                  {c.added_manually && (
                    <IconButton
                      size="small"
                      color="error"
                      disabled={visitLocked}
                      onClick={() => {
                        removeContributor(c.staff_id);
                        setToast(`${c.name} removed`);
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
              {contributors.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No contributors yet
                </Typography>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Autocomplete
                size="small"
                fullWidth
                options={available}
                getOptionLabel={(o) => o.name}
                value={selected}
                onChange={(_, v) => setSelected(v)}
                disabled={visitLocked}
                renderInput={(params) => (
                  <TextField {...params} label="Add staff" placeholder="Search staff…" />
                )}
              />
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleAdd}
                disabled={!selected || visitLocked}
                sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
              >
                Add
              </Button>
            </div>

            {visitLocked && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This visit is locked by a finalized compensation period. Non-admins cannot
                change contributors, clinical data, or products. Admins can override (audited).
              </Alert>
            )}
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default VisitContributorDemo;
