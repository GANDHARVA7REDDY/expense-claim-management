import React, { useState } from 'react';
import {
  AppBar, Box, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  MenuItem, Select, Toolbar, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import FactCheckIcon from '@mui/icons-material/FactCheckOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useApp } from '../context/AppContext.jsx';
import { canAccess } from '../services/permissions.js';
import { ConfirmDialog } from './Dialogs.jsx';

const DRAWER = 248;

const NAV = [
  { path: '/', label: 'Dashboard', icon: <DashboardIcon />, feature: 'dashboard' },
  { path: '/claims', label: 'My Claims', icon: <ReceiptLongIcon />, feature: 'claims' },
  { path: '/approvals', label: 'Manager Approvals', icon: <FactCheckIcon />, feature: 'approvals' },
  { path: '/finance', label: 'Finance Processing', icon: <PaymentsIcon />, feature: 'finance' },
  { path: '/reports', label: 'Reports', icon: <AssessmentIcon />, feature: 'reports' },
  { path: '/history', label: 'Activity History', icon: <HistoryIcon />, feature: 'history' },
  { path: '/employees', label: 'Employees', icon: <PeopleIcon />, feature: 'employees' },
  { path: '/categories', label: 'Expense Categories', icon: <CategoryIcon />, feature: 'categories' },
];

const ROLE_COLOR = { Employee: 'default', Manager: 'secondary', Finance: 'success' };

export default function Layout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { user, employees, switchUser, resetData, notify } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items = NAV.filter((n) => canAccess(user, n.feature));
  const isSelected = (p) => (p === '/' ? pathname === '/' : pathname.startsWith(p));

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
          C
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>ClaimEase</Typography>
          <Typography variant="caption" color="text.secondary">Submit. Approve. Reimburse.</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List component="nav" aria-label="Main navigation">
        {items.map((n) => (
          <ListItemButton
            key={n.path}
            component={RouterLink}
            to={n.path}
            selected={isSelected(n.path)}
            onClick={() => setOpen(false)}
            data-testid={`nav-${n.feature}`}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{n.icon}</ListItemIcon>
            <ListItemText primary={n.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1.5 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            Employee Expense Claims
          </Typography>
          <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />
          <Chip label={user.role} color={ROLE_COLOR[user.role]} size="small" data-testid="role-badge" />
          <Select
            value={user.id}
            onChange={(e) => {
              switchUser(e.target.value);
              navigate('/');
            }}
            sx={{ minWidth: 200 }}
            inputProps={{ 'aria-label': 'Switch user', 'data-testid': 'user-switcher' }}
            SelectDisplayProps={{ 'data-testid': 'user-switcher-display' }}
          >
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id} data-testid={`user-option-${e.id}`}>
                {e.name} ({e.role})
              </MenuItem>
            ))}
          </Select>
          <Tooltip title="Reset demo data">
            <IconButton onClick={() => setConfirmReset(true)} aria-label="Reset demo data" data-testid="reset-data">
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ width: DRAWER, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER, boxSizing: 'border-box' } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Toolbar />
        {children}
      </Box>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="This erases all claims, history and payments you created and restores the original sample data."
        confirmText="Reset"
        color="error"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetData();
          setConfirmReset(false);
          navigate('/');
          notify('Demo data restored');
        }}
      />
    </Box>
  );
}
