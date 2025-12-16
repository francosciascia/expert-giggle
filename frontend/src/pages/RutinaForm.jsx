import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { rutinasAPI, ejerciciosAPI } from '../services/api'

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const createEmptyExercise = () => ({
  nombre: '',
  dia_semana: DIAS_SEMANA[0],
  series: '',
  repeticiones: '',
  peso: '',
  notas: '',
  orden: '',
})

function RutinaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rutina, setRutina] = useState({ nombre: '', descripcion: '' })
  const [ejercicios, setEjercicios] = useState([createEmptyExercise()])
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchRutina = async () => {
    if (!id) return
    // Carga datos al editar una rutina existente
    setLoading(true)
    setError(null)
    try {
      const response = await rutinasAPI.getById(id)
      setRutina({
        nombre: response.data.nombre,
        descripcion: response.data.descripcion || '',
      })
      setEjercicios(
        response.data.ejercicios.length
          ? response.data.ejercicios.map((ej) => ({
              id: ej.id,
              nombre: ej.nombre,
              dia_semana: ej.dia_semana,
              series: ej.series,
              repeticiones: ej.repeticiones,
              peso: ej.peso ?? '',
              notas: ej.notas ?? '',
              orden: ej.orden ?? 0,
            }))
          : [createEmptyExercise()]
      )
    } catch (err) {
      setError('No se pudo cargar la rutina.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRutina()
  }, [id])

  const handleExerciseChange = (index, key, value) => {
    // Actualiza un ejercicio del formulario por índice
    setEjercicios((prev) =>
      prev.map((ej, itemIndex) => (itemIndex === index ? { ...ej, [key]: value } : ej))
    )
  }

  const addExercise = () => {
    setEjercicios((prev) => [...prev, createEmptyExercise()])
  }

  const removeExercise = async (index) => {
    const ejercicio = ejercicios[index]
    if (ejercicio?.id) {
      if (!window.confirm('¿Eliminar este ejercicio?')) return
      try {
        await ejerciciosAPI.delete(ejercicio.id)
      } catch {
        setError('No se pudo eliminar el ejercicio existente.')
        return
      }
    }
    setEjercicios((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const ejerciciosProcesados = ejercicios
      .filter((ej) => ej.nombre.trim())
      .map((ej, index) => ({
        original: ej,
        payload: {
          nombre: ej.nombre,
          dia_semana: ej.dia_semana,
          series: Number(ej.series),
          repeticiones: Number(ej.repeticiones),
          peso: ej.peso === '' ? undefined : Number(ej.peso),
          notas: ej.notas?.trim() || undefined,
          orden: Number(ej.orden ?? index),
        },
      }))

    if (!rutina.nombre.trim()) {
      setError('El nombre de la rutina es requerido.')
      setSaving(false)
      return
    }

    try {
      if (id) {
        await rutinasAPI.update(id, { nombre: rutina.nombre, descripcion: rutina.descripcion })
        await Promise.all(
          ejerciciosProcesados.map(async ({ original, payload }) => {
            if (original?.id) {
              await ejerciciosAPI.update(original.id, payload)
            } else {
              await rutinasAPI.addExercise(id, payload)
            }
          })
        )
        setSuccess('Rutina actualizada correctamente.')
        await fetchRutina()
      } else {
        const response = await rutinasAPI.create({
          ...rutina,
          ejercicios: ejerciciosProcesados.map((entry) => entry.payload),
        })
        navigate(`/rutinas/${response.data.id}`)
      }
    } catch (err) {
      setError('No se pudo guardar la rutina.')
    } finally {
      setSaving(false)
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
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box mb={2}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: 'text.secondary' }}
        >
          Volver atrás
        </Button>
      </Box>
      <Typography variant="h5" mb={2}>
        {id ? 'Editar rutina' : 'Nueva rutina'}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nombre"
              value={rutina.nombre}
              fullWidth
              required
              onChange={(event) => setRutina((prev) => ({ ...prev, nombre: event.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              value={rutina.descripcion}
              fullWidth
              multiline
              minRows={2}
              onChange={(event) => setRutina((prev) => ({ ...prev, descripcion: event.target.value }))}
            />
          </Grid>
        </Grid>

        <Box mt={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Ejercicios</Typography>
            <Button variant="text" onClick={addExercise} startIcon={<AddCircleOutlineIcon />}>
              Agregar ejercicio
            </Button>
          </Box>
          {ejercicios.map((ejercicio, index) => (
            <Paper key={`${ejercicio.id ?? 'nuevo'}-${index}`} sx={{ p: 2, mb: 2 }} variant="outlined">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre del ejercicio"
                    value={ejercicio.nombre}
                    fullWidth
                    onChange={(event) => handleExerciseChange(index, 'nombre', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Día de la semana"
                    value={ejercicio.dia_semana}
                    fullWidth
                    onChange={(event) => handleExerciseChange(index, 'dia_semana', event.target.value)}
                  >
                    {DIAS_SEMANA.map((dia) => (
                      <MenuItem key={dia} value={dia}>
                        {dia}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Series"
                    type="number"
                    value={ejercicio.series}
                    fullWidth
                    onChange={(event) => handleExerciseChange(index, 'series', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Repeticiones"
                    type="number"
                    value={ejercicio.repeticiones}
                    fullWidth
                    onChange={(event) => handleExerciseChange(index, 'repeticiones', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Peso (kg)"
                    type="number"
                    value={ejercicio.peso}
                    fullWidth
                    onChange={(event) => handleExerciseChange(index, 'peso', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Orden"
                    type="number"
                    value={ejercicio.orden}
                    fullWidth
                    onChange={(event) => handleExerciseChange(index, 'orden', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <TextField
                    label="Notas"
                    value={ejercicio.notas}
                    fullWidth
                    multiline
                    minRows={2}
                    onChange={(event) => handleExerciseChange(index, 'notas', event.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeExercise(index)}
                  >
                    Eliminar ejercicio
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>

        <Box display="flex" gap={2} mt={3}>
          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar rutina'}
          </Button>
          <Button variant="text" onClick={() => navigate('/')}>
            Cancelar
          </Button>
        </Box>
      </form>
    </Paper>
  )
}

export default RutinaForm

