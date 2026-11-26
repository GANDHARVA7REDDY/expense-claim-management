import React from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { canAccess } from '../services/permissions.js';

/** Route guard: renders children only when the current role may open the module. */
export default function RoleRoute({ feature, children }) {
  const { user } = useApp();
  if (canAccess(user, feature)) return children;
  return (
    <Stack spacing={2} sx={{ maxWidth: 560 }} data-testid="access-denied">
      <Alert severity="warning">
        Access denied. The {user.role} role cannot open this page. Use the user switcher in the top bar to change role.
      </Alert>
      <Button component={RouterLink} to="/" variant="contained" sx={{ alignSelf: 'flex-start' }}>
        Back to dashboard
      </Button>
    </Stack>
  );
}
