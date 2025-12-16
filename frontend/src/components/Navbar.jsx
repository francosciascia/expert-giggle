import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

function Navbar() {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(90deg, #e2231a 0%, #c71b11 50%, #a5140d 100%)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2, sm: 4 },
          py: 1,
        }}
      >
        <Typography
          component={RouterLink}
          to="/"
          variant="h6"
          color="inherit"
          sx={{
            textDecoration: 'none',
            letterSpacing: 0.6,
            fontWeight: 800,
            fontFamily: "'Montserrat', 'Inter', 'Segoe UI', sans-serif",
          }}
        >
          RUTINAS NEO CLUB XXL
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={RouterLink}
            to="/plan"
            color="inherit"
            variant="outlined"
            size="small"
            sx={{
              borderColor: 'rgba(255,255,255,0.7)',
              color: '#fff',
              '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.14)' },
            }}
          >
            Plan semanal
          </Button>
          <Button
            component={RouterLink}
            to="/rutinas/nueva"
            color="secondary"
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#fff',
              color: '#c71b11',
              fontWeight: 700,
              boxShadow: '0 12px 25px rgba(0,0,0,0.2)',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            Nueva rutina
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar

