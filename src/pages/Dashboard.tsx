import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  CalendarToday,
  People,

  TrendingUp,
  TrendingDown,
  LocalHospital,
  Receipt,
  AccountBalance,
  Refresh
} from '@mui/icons-material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useApp } from '@/contexts/AppContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'


// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
)

interface DashboardMetrics {
  agendamentos: {
    hoje: number
    semana: number
    mes: number
    pendentes: number
    total: number
    confirmados: number
    cancelados: number
  }
  clientes: {
    total: number
    novos_mes: number
    pacientes_unicos: number
  }
  medicos: {
    total: number
    ativos: number
  }
  financeiro: {
    receitas_mes: number
    despesas_mes: number
    saldo_mes: number
    contas_receber: number
    contas_pagar: number
  }
  conversao: {
    taxa_conversao: number
    agendamentos_realizados: number
  }
}

interface ChartData {
  agendamentos_por_status: { status: string; count: number }[]
  agendamentos_por_mes: { mes: string; count: number }[]
  agendamentos_por_filial: { filial: string; count: number }[]
  receitas_despesas_mes: { mes: string; receitas: number; despesas: number }[]
  top_medicos: { nome: string; agendamentos: number }[]
}

// Interfaces removidas pois não são utilizadas

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

function MetricCard({ title, value, icon, color, trend, loading }: MetricCardProps) {
  // const theme = useTheme() // removido pois não é utilizado
  
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" fontWeight="bold" color={color}>
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={
              {
                width: 60,
                height: 60,
                borderRadius: 2,
                backgroundColor: alpha(color, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }
          >
            {React.cloneElement(icon as React.ReactElement, {
              sx: { fontSize: 30, color }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const theme = useTheme()
  const { userData } = useAuth()
  const { state } = useApp()
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const hoje = new Date()
      const inicioMes = startOfMonth(hoje)
      const fimMes = endOfMonth(hoje)
      // const mesAnterior = subMonths(hoje, 1) // removido pois não é utilizado
      // const inicioMesAnterior = startOfMonth(mesAnterior)
      // const fimMesAnterior = endOfMonth(mesAnterior) // removido pois não é utilizado
      const hojeStr = format(hoje, 'yyyy-MM-dd')

      // Buscar todos os agendamentos
      const { data: agendamentosData } = await supabase
        .from('agendamentos')
        .select(`
          *,
          filiais(nome),
          medicos(nome, especialidade)
        `)
        .order('created_at', { ascending: false })

      // Buscar agendamentos do mês atual
      const { data: agendamentosMesData } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data', format(fimMes, 'yyyy-MM-dd'))

      // Buscar filiais
      const { data: filiaisData } = await supabase
        .from('filiais')
        .select('*')
        .eq('ativa', true)

      // Buscar médicos
      const { data: medicosData } = await supabase
        .from('medicos')
        .select('*')

      // Buscar dados financeiros
      const { data: titulosData } = await supabase
        .from('titulos')
        .select('*')
        .gte('data_vencimento', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(fimMes, 'yyyy-MM-dd'))

      // Calcular métricas de agendamentos
      const totalAgendamentos = agendamentosData?.length || 0
      const agendamentosHoje = agendamentosData?.filter(
        a => a.data === hojeStr
      ).length || 0

      const agendamentosMes = agendamentosMesData?.length || 0
      const agendamentosPendentes = agendamentosData?.filter(a => a.status === 'pendente').length || 0
      const agendamentosConfirmados = agendamentosData?.filter(a => a.status === 'confirmado').length || 0
      const agendamentosCancelados = agendamentosData?.filter(a => a.status === 'cancelado').length || 0
      const agendamentosRealizados = agendamentosData?.filter(a => a.status === 'realizado').length || 0

      // Calcular pacientes únicos (baseado no telefone)
      const pacientesUnicos = new Set(
        agendamentosData?.map(a => a.cliente_telefone) || []
      ).size

      // Calcular taxa de conversão (confirmados + realizados / total)
      const agendamentosEfetivos = agendamentosConfirmados + agendamentosRealizados
      const taxaConversao = totalAgendamentos > 0 ? (agendamentosEfetivos / totalAgendamentos) * 100 : 0

      const medicosAtivos = medicosData?.filter(m => m.ativo).length || 0

      const receitasMes = titulosData?.filter(
        t => t.tipo === 'receber' && t.status === 'pago'
      ).reduce((sum, t) => sum + (t.valor || 0), 0) || 0

      const despesasMes = titulosData?.filter(
        t => t.tipo === 'pagar' && t.status === 'pago'
      ).reduce((sum, t) => sum + (t.valor || 0), 0) || 0

      const contasReceber = titulosData?.filter(
        t => t.tipo === 'receber' && t.status === 'pendente'
      ).reduce((sum, t) => sum + (t.valor || 0), 0) || 0

      const contasPagar = titulosData?.filter(
        t => t.tipo === 'pagar' && t.status === 'pendente'
      ).reduce((sum, t) => sum + (t.valor || 0), 0) || 0

      const metricsData: DashboardMetrics = {
        agendamentos: {
          hoje: agendamentosHoje,
          semana: agendamentosData?.length || 0,
          mes: agendamentosMes,
          pendentes: agendamentosPendentes,
          total: totalAgendamentos,
          confirmados: agendamentosConfirmados,
          cancelados: agendamentosCancelados
        },
        clientes: {
          total: pacientesUnicos,
          novos_mes: 0, // Será calculado se necessário
          pacientes_unicos: pacientesUnicos
        },
        medicos: {
          total: medicosData?.length || 0,
          ativos: medicosAtivos
        },
        financeiro: {
          receitas_mes: receitasMes,
          despesas_mes: despesasMes,
          saldo_mes: receitasMes - despesasMes,
          contas_receber: contasReceber,
          contas_pagar: contasPagar
        },
        conversao: {
          taxa_conversao: taxaConversao,
          agendamentos_realizados: agendamentosRealizados
        }
      }

      // Dados para gráficos
      const agendamentosPorFilial = filiaisData?.map(filial => ({
        filial: filial.nome,
        count: agendamentosData?.filter(a => a.filial_id === filial.id).length || 0
      })) || []

      const agendamentosPorMes: { [key: string]: number } = {}
      agendamentosData?.forEach(apt => {
        const date = new Date(apt.data)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        agendamentosPorMes[monthKey] = (agendamentosPorMes[monthKey] || 0) + 1
      })

      const sortedMonths = Object.keys(agendamentosPorMes).sort()
      const agendamentosPorMesArray = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-')
        const monthNames = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ]
        return {
          mes: `${monthNames[parseInt(monthNum) - 1]}/${year}`,
          count: agendamentosPorMes[month]
        }
      })

      const topMedicos = medicosData?.map(medico => ({
        nome: medico.nome,
        agendamentos: agendamentosData?.filter(a => a.medico_id === medico.id).length || 0
      })).sort((a, b) => b.agendamentos - a.agendamentos).slice(0, 5) || []

      const chartDataResult: ChartData = {
        agendamentos_por_status: [
          { status: 'Pendente', count: agendamentosPendentes },
          { status: 'Confirmado', count: agendamentosConfirmados },
          { status: 'Realizado', count: agendamentosRealizados },
          { status: 'Cancelado', count: agendamentosCancelados }
        ],
        agendamentos_por_mes: agendamentosPorMesArray,
        agendamentos_por_filial: agendamentosPorFilial,
        receitas_despesas_mes: [],
        top_medicos: topMedicos
      }

      setMetrics(metricsData)
      setChartData(chartDataResult)
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [state.filialSelecionada])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <IconButton color="inherit" size="small" onClick={loadDashboardData}>
          <Refresh />
        </IconButton>
      }>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bem-vindo(a), {userData?.nome}! Aqui está um resumo do seu sistema.
          </Typography>
        </Box>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Métricas principais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendamentos Hoje"
            value={metrics?.agendamentos.hoje || 0}
            icon={<CalendarToday />}
            color={theme.palette.primary.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Agendamentos"
            value={metrics?.agendamentos.total || 0}
            icon={<CalendarToday />}
            color={theme.palette.info.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pacientes Únicos"
            value={metrics?.clientes.pacientes_unicos || 0}
            icon={<People />}
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxa de Conversão"
            value={`${(metrics?.conversao.taxa_conversao || 0).toFixed(1)}%`}
            icon={<TrendingUp />}
            color={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Métricas de agendamentos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendamentos Pendentes"
            value={metrics?.agendamentos.pendentes || 0}
            icon={<CalendarToday />}
            color={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendamentos Confirmados"
            value={metrics?.agendamentos.confirmados || 0}
            icon={<CalendarToday />}
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Agendamentos Realizados"
            value={metrics?.conversao.agendamentos_realizados || 0}
            icon={<LocalHospital />}
            color={theme.palette.primary.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Médicos Ativos"
            value={metrics?.medicos.ativos || 0}
            icon={<LocalHospital />}
            color={theme.palette.info.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Métricas financeiras */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Receitas do Mês"
            value={`R$ ${(metrics?.financeiro.receitas_mes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<AccountBalance />}
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Despesas do Mês"
            value={`R$ ${(metrics?.financeiro.despesas_mes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<Receipt />}
            color={theme.palette.error.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Contas a Receber"
            value={`R$ ${(metrics?.financeiro.contas_receber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp />}
            color={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Contas a Pagar"
            value={`R$ ${(metrics?.financeiro.contas_pagar || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingDown />}
            color={theme.palette.error.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agendamentos por Status
              </Typography>
              {chartData?.agendamentos_por_status && (
                <Box sx={{ height: 300 }}>
                  <Pie
                    data={{
                      labels: chartData.agendamentos_por_status.map(item => item.status),
                      datasets: [{
                        data: chartData.agendamentos_por_status.map(item => item.count),
                        backgroundColor: [
                          theme.palette.warning.main,
                          theme.palette.success.main,
                          theme.palette.primary.main,
                          theme.palette.error.main
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agendamentos por Filial
              </Typography>
              {chartData?.agendamentos_por_filial && (
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={{
                      labels: chartData.agendamentos_por_filial.map(item => item.filial),
                      datasets: [{
                        label: 'Agendamentos',
                        data: chartData.agendamentos_por_filial.map(item => item.count),
                        backgroundColor: theme.palette.primary.main,
                        borderColor: theme.palette.primary.dark,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agendamentos por Mês
              </Typography>
              {chartData?.agendamentos_por_mes && (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={{
                      labels: chartData.agendamentos_por_mes.map(item => item.mes),
                      datasets: [{
                        label: 'Agendamentos',
                        data: chartData.agendamentos_por_mes.map(item => item.count),
                        borderColor: theme.palette.success.main,
                        backgroundColor: `${theme.palette.success.main}20`,
                        tension: 0.1,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Médicos por Agendamentos
              </Typography>
              {chartData?.top_medicos && (
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={{
                      labels: chartData.top_medicos.map(item => item.nome),
                      datasets: [{
                        label: 'Agendamentos',
                        data: chartData.top_medicos.map(item => item.agendamentos),
                        backgroundColor: theme.palette.info.main,
                        borderColor: theme.palette.info.dark,
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard