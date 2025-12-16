import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { planAPI, rutinasAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function PlanSemanal() {
  const [plan, setPlan] = useState({})
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const cargarDatos = async () => {
    // Obtiene plan y rutinas disponibles en paralelo
    setLoading(true)
    setError(null)
    try {
      const [planRes, rutinasRes] = await Promise.all([
        planAPI.get(),
        rutinasAPI.getAll({ limit: 200 }),
      ])
      const planMap = {}
      ;(planRes.data || []).forEach((item) => {
        planMap[item.dia_semana] = item
      })
      setPlan(planMap)
      setRutinas(rutinasRes.data?.items ?? [])
    } catch (err) {
      setError('No se pudo cargar el plan semanal.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleChange = async (dia, rutinaId) => {
    try {
      if (!rutinaId) {
        await planAPI.clearDay(dia)
        setPlan((prev) => ({ ...prev, [dia]: { dia_semana: dia, rutina_id: null } }))
        return
      }
      const response = await planAPI.setDay(dia, rutinaId)
      setPlan((prev) => ({ ...prev, [dia]: response.data }))
    } catch (err) {
      setError('No se pudo actualizar el plan.')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={2}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => window.history.back()}
          sx={{ color: 'text.secondary' }}
        >
          Volver atrás
        </Button>
      </Box>
      <Typography variant="h5" mb={3}>
        Plan semanal
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {DIAS_SEMANA.map((dia) => {
          const asignacion = plan[dia]
          return (
            <Grid item xs={12} md={6} lg={4} key={dia}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {dia}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rutina</InputLabel>
                    <Select
                      label="Rutina"
                      value={asignacion?.rutina_id ?? ''}
                      onChange={(event) => handleChange(dia, event.target.value)}
                    >
                      <MenuItem value="">Sin rutina</MenuItem>
                      {rutinas.map((rutina) => (
                        <MenuItem key={rutina.id} value={rutina.id}>
                          {rutina.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {asignacion?.rutina_id && (
                    <Box mt={2}>
                      <Button
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => navigate(`/rutinas/${asignacion.rutina_id}`)}
                      >
                        Ver rutina
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default PlanSemanal

