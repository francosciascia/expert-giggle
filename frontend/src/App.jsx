import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Container from '@mui/material/Container'

import Navbar from './components/Navbar'
import RutinaList from './pages/RutinaList'
import RutinaDetail from './pages/RutinaDetail'
import RutinaForm from './pages/RutinaForm'
import PlanSemanal from './pages/PlanSemanal'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e2231a', // rojo estilo AnyDesk
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1f1f1f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f6fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f1115',
      secondary: '#4a4f5a',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ['Montserrat', 'Inter', 'Segoe UI', 'sans-serif'].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/" element={<RutinaList />} />
            <Route path="/rutinas/nueva" element={<RutinaForm />} />
            <Route path="/rutinas/:id" element={<RutinaDetail />} />
            <Route path="/rutinas/:id/editar" element={<RutinaForm />} />
            <Route path="/plan" element={<PlanSemanal />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  )
}

export default App

