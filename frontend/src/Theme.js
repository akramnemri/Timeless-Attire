import { createTheme } from '@mui/material/styles';

export const vintageColors = {
  primary: '#8B9A6B',
  secondary: '#D8A7B1',
  secondaryHover: '#E5BFC7',
  background: '#F5E8D3',
  accent: '#C9A66B',
  accentHover: '#D4B583',
  textPrimary: '#4A3728',
  textSecondary: '#5A626F',
};

export const vintageTheme = createTheme({
  palette: {
    primary: { main: vintageColors.primary },
    secondary: { main: vintageColors.secondary },
    background: {
      default: vintageColors.background,
      paper: '#FDF6E8',
    },
  },
  typography: {
    fontFamily: "'Lora', sans-serif",
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h2: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h4: {
      fontFamily: "'Playfair Display', serif",
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h6: {
      fontFamily: "'Lora', sans-serif",
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: () => ({
        body: {
          backgroundImage: 'url("/crisp-paper-ruffles.png")',
          backgroundColor: vintageColors.background,
          backgroundBlendMode: 'overlay',
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat',
        },
      }),
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '8px 16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
          '&:focus': {
            outline: `2px solid ${vintageColors.accent}`,
            outlineOffset: '2px',
          },
        },
        containedPrimary: {
          backgroundColor: vintageColors.secondary,
          color: vintageColors.textPrimary,
          '&:hover': {
            backgroundColor: vintageColors.secondaryHover,
          },
        },
        outlinedPrimary: {
          borderColor: vintageColors.accent,
          color: vintageColors.accent,
          '&:hover': {
            borderColor: vintageColors.accentHover,
            color: vintageColors.accentHover,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(45deg, ${vintageColors.primary} 30%, ${vintageColors.secondary} 90%)`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#FDF6E8',
            '&:hover fieldset': {
              borderColor: vintageColors.accent,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState && {
            backgroundImage: [
              `linear-gradient(to bottom, ${vintageColors.background}, #FDF6E8)`,
              `radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 1px)`,
            ].join(', '),
            backgroundBlendMode: 'overlay',
            backgroundColor: vintageColors.background,
            backgroundSize: 'auto, 3px 3px',
            backgroundRepeat: 'repeat',
            opacity: 0.98,
            filter: 'sepia(10%)',
          }),
        }),
      },
    },
    MuiCardMedia: {
      styleOverrides: {
        root: {
          border: '1px solid #000000',
          padding: '8px 8px 24px 8px',
          backgroundColor: '#FDF6E8',
          borderRadius: '2px',
          boxSizing: 'border-box', // Ensure padding doesn't increase the size
        },
      },
    },
  },
});

export default vintageTheme;