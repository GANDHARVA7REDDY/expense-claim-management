import { createTheme } from '@mui/material/styles';

// ClaimEase design tokens
export const STATUS_COLORS = {
  Draft: 'default',
  Submitted: 'warning',
  Approved: 'info',
  Rejected: 'error',
  Paid: 'success',
};

export default createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#00897b' },
    background: { default: '#f4f6fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { variant: 'outlined' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, background: '#f0f3f9' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
  },
});
