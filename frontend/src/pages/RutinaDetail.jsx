import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
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

function groupExercises(ejercicios = []) {
  // Agrupa ejercicios por día para pintarlos separados
  return ejercicios.reduce((acc, ejercicio) => {
    const dia = ejercicio.dia_semana
    if (!acc[dia]) {
      acc[dia] = []
    }
    acc[dia].push(ejercicio)
    return acc
  }, {})
}

function RutinaDetail() {
  const { id } = useParams()
  const [rutina, setRutina] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const navigate = useNavigate()

  const fetchRutina = async () => {
    // Carga la rutina y sus ejercicios
    setLoading(true)
    setError(null)
    try {
      const response = await rutinasAPI.getById(id)
      setRutina(response.data)
    } catch (err) {
      setError('No se pudo cargar la rutina solicitada.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRutina()
  }, [id])

  const handleDeleteExercise = async (ejercicioId) => {
    if (!window.confirm('¿Eliminar este ejercicio?')) return
    try {
      await ejerciciosAPI.delete(ejercicioId)
      await fetchRutina()
    } catch (err) {
      setError('No se pudo eliminar el ejercicio.')
    }
  }

  const handleDragStart = (ejercicioId) => {
    setDraggingId(ejercicioId)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDrop = async (event, targetId, dia) => {
    event.preventDefault()
    if (!draggingId || draggingId === targetId) return

    // Solo permitir reorden dentro del mismo día
    const ejerciciosDia = (rutina?.ejercicios || []).filter((e) => e.dia_semana === dia)
    const fromIndex = ejerciciosDia.findIndex((e) => e.id === draggingId)
    const toIndex = ejerciciosDia.findIndex((e) => e.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const reordered = [...ejerciciosDia]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    // Asignar nuevo orden secuencial dentro del día
    const updates = reordered.map((e, idx) => ({ id: e.id, orden: idx + 1 }))

    // Refrescar estado local optimista
    const updatedExercises = rutina.ejercicios.map((e) => {
      const found = updates.find((u) => u.id === e.id)
      return found ? { ...e, orden: found.orden } : e
    })
    setRutina({ ...rutina, ejercicios: updatedExercises })

    try {
      await rutinasAPI.reorderExercises(rutina.id, updates)
      await fetchRutina()
    } catch (err) {
      setError('No se pudo reordenar. Reintenta.')
    } finally {
      setDraggingId(null)
    }
  }

  const handleExportPdf = async () => {
    try {
      const response = await rutinasAPI.exportOnePdf(id)
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rutina_${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('No se pudo exportar la rutina.')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        {error}
      </Alert>
    )
  }

  if (!rutina) {
    return null
  }

  const ejerciciosPorDia = groupExercises(rutina.ejercicios)

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">{rutina.nombre}</Typography>
          <Typography color="text.secondary">{rutina.descripcion || 'Sin descripción'}</Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPdf}
          >
            Exportar PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/rutinas/${rutina.id}/editar`)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {DIAS_SEMANA.map((dia) => {
        const ejercicios = ejerciciosPorDia[dia]
        if (!ejercicios || ejercicios.length === 0) return null
        return (
          <Box key={dia} mb={3}>
            <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>
              {dia}
            </Typography>
            <List dense>
              {ejercicios
                .sort((a, b) => a.orden - b.orden)
                .map((ejercicio) => (
                    <ListItem
                      key={ejercicio.id}
                      divider
                      draggable
                      onDragStart={() => handleDragStart(ejercicio.id)}
                      onDragOver={handleDragOver}
                      onDrop={(event) => handleDrop(event, ejercicio.id, dia)}
                      sx={{ cursor: 'grab' }}
                    >
                      <ListItemText
                        primary={`${ejercicio.nombre} · ${ejercicio.series}x${ejercicio.repeticiones}`}
                        secondary={`Peso: ${ejercicio.peso ?? 'modalidad peso corporal'} · Orden: ${
                          ejercicio.orden ?? 0
                        } · Notas: ${ejercicio.notas || 'Sin notas'}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small" disabled>
                          <DragIndicatorIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          aria-label={`Eliminar ejercicio ${ejercicio.nombre}`}
                          onClick={() => handleDeleteExercise(ejercicio.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
            </List>
          </Box>
        )
      })}

      {Object.keys(ejerciciosPorDia).length === 0 && (
        <Typography color="text.secondary">No hay ejercicios cargados.</Typography>
      )}
    </Paper>
  )
}

export default RutinaDetail

