import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { rutinasAPI } from '../services/api'

function RutinaList() {
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [diaFilter, setDiaFilter] = useState('')
  const [ejercicioFilter, setEjercicioFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 6
  const navigate = useNavigate()

  // Carga rutinas con paginación y filtros (búsqueda, día y ejercicio)
  const fetchRutinas = async (nextPage = 1, options = {}) => {
    const { term = searchTerm, dia = diaFilter, ejercicio = ejercicioFilter } = options
    setLoading(true)
    setError(null)
    const trimmedTerm = term.trim()
    const trimmedEjercicio = ejercicio.trim()
    const hasFilters = trimmedTerm.length > 0 || trimmedEjercicio.length > 0 || !!dia
    setSearching(hasFilters)

    const skip = (nextPage - 1) * PAGE_SIZE
    const params = { skip, limit: PAGE_SIZE }
    if (dia) params.dia_semana = dia
    if (trimmedEjercicio) params.ejercicio_nombre = trimmedEjercicio

    const isTermSearch = trimmedTerm.length > 0

    try {
      const response = isTermSearch
        ? await rutinasAPI.search(trimmedTerm, params)
        : await rutinasAPI.getAll(params)
      // API devuelve { items, total, ... }
      setRutinas(response.data?.items ?? [])
      setTotal(response.data?.total ?? 0)
      setPage(nextPage)
    } catch (err) {
      setError('No se pudieron cargar las rutinas. Reintenta.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    fetchRutinas(1, { term: value })
  }

  const handleDiaChange = (value) => {
    setDiaFilter(value)
    fetchRutinas(1, { dia: value })
  }

  const handleEjercicioChange = (value) => {
    setEjercicioFilter(value)
    fetchRutinas(1, { ejercicio: value })
  }

  const handlePageChange = (_event, value) => {
    fetchRutinas(value)
  }

  useEffect(() => {
    fetchRutinas(1, { term: '', dia: '', ejercicio: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta rutina? Esta acción no se puede deshacer.')) {
      return
    }
    try {
      await rutinasAPI.delete(id)
      setRutinas((prev) => prev.filter((rutina) => rutina.id !== id))
    } catch (err) {
      setError('No se pudo eliminar la rutina.')
    }
  }

  const handleDuplicate = async (id) => {
    try {
      const response = await rutinasAPI.duplicate(id)
      await fetchRutinas(page)
      navigate(`/rutinas/${response.data?.id}`)
    } catch (err) {
      setError('No se pudo duplicar la rutina.')
    }
  }


  return (
    <Box>
      <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
        <TextField
          fullWidth
          sx={{ flex: { sm: 2 } }} // más ancho en desktop
          placeholder="Buscar rutinas..."
          value={searchTerm}
          onChange={(event) => handleSearch(event.target.value)}
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
        />
        <TextField
          select
          label="Día de la semana"
          fullWidth
          sx={{ flex: { sm: 0.9 } }} // más angosto en desktop
          value={diaFilter}
          onChange={(event) => handleDiaChange(event.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="Lunes">Lunes</MenuItem>
          <MenuItem value="Martes">Martes</MenuItem>
          <MenuItem value="Miércoles">Miércoles</MenuItem>
          <MenuItem value="Jueves">Jueves</MenuItem>
          <MenuItem value="Viernes">Viernes</MenuItem>
          <MenuItem value="Sábado">Sábado</MenuItem>
          <MenuItem value="Domingo">Domingo</MenuItem>
        </TextField>
        <TextField
          fullWidth
          sx={{ flex: { sm: 1.4 } }}
          label="Tipo / nombre de ejercicio"
          placeholder="Ej: press banca"
          value={ejercicioFilter}
          onChange={(event) => handleEjercicioChange(event.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/rutinas/nueva')}
        >
          Nueva rutina
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : rutinas.length === 0 ? (
        <Box textAlign="center" mt={6}>
          <Typography variant="h6">
            {searching ? 'No se encontraron coincidencias.' : 'No hay rutinas registradas.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rutinas.map((rutina) => (
            <Grid item xs={12} md={6} key={rutina.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">{rutina.nombre}</Typography>
                  <Typography color="text.secondary">{rutina.descripcion}</Typography>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    <Chip label={`${rutina.total_ejercicios} ejercicios`} size="small" />
                    <Chip label={`ID ${rutina.id}`} size="small" />
                  </Box>
                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/rutinas/${rutina.id}`)}
                    >
                      Ver detalle
                    </Button>
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/rutinas/${rutina.id}/editar`)}
                      aria-label="editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleDuplicate(rutina.id)}
                      aria-label="duplicar"
                    >
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(rutina.id)}
                      aria-label="eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Box>
  )
}

export default RutinaList

