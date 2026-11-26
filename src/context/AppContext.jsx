import React, { createContext, useCallback, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import {
  ensureSeeded, getEmployees, getSessionUserId, setSessionUserId, resetDemoData,
} from '../services/dataStore.js';
import { RuleError } from '../services/errors.js';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [userId, setUserId] = useState(() => {
    ensureSeeded();
    return getSessionUserId();
  });
  const [, setVersion] = useState(0);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const notify = useCallback((message, severity = 'success') => setToast({ message, severity, key: Date.now() }), []);

  const employees = getEmployees();
  const user = employees.find((e) => e.id === userId) || employees[0];

  const switchUser = useCallback((id) => {
    setSessionUserId(id);
    setUserId(id);
  }, []);

  const resetData = useCallback(() => {
    resetDemoData();
    setUserId(getSessionUserId());
    refresh();
  }, [refresh]);

  /** Runs a service call; shows a toast and returns true on success, false if a rule blocked it. */
  const act = useCallback(
    (fn, successMessage) => {
      try {
        const result = fn();
        refresh();
        if (successMessage) notify(successMessage, 'success');
        return result === undefined ? true : result;
      } catch (e) {
        if (e instanceof RuleError) {
          notify(e.message, 'error');
          return false;
        }
        throw e;
      }
    },
    [notify, refresh],
  );

  const value = { user, employees, switchUser, resetData, refresh, notify, act };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={!!toast}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
