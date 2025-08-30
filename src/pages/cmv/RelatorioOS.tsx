import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { supabase } from '../../services/supabase'
import jsPDF from 'jspdf'

interface Filial {
  id: number
  nome: string
}

interface Medico {
  id: string
  nome: string
}

interface CustoOS {
  id: number
  filial_id: number
  data: string
  valor_venda: number
  custo_lentes: number
  custo_armacoes: number
  custo_mkt: number
  outros_custos: number
  medico_id?: string
  numero_tco?: string
}

interface OS {
  id: number
  filial: string
  filial_id: number
  data: string
  valorVenda: number
  custoLentes: number
  custoArmacoes: number
  custoMkt: number
  outrosCustos: number
  medico_id?: string
  numero_tco?: string
  nomeMedico?: string
}

const RelatorioOS: React.FC = () => {
  const [filtros, setFiltros] = useState({ filial: '', dataInicial: '', dataFinal: '' })
  const [osList, setOsList] = useState<OS[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [carregandoFiliais, setCarregandoFiliais] = useState(true)
  const [carregandoOS, setCarregandoOS] = useState(true)
  const [filialMap, setFilialMap] = useState<Map<number, string>>(new Map())
  const [alert, setAlert] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    const buscarDados = async () => {
      try {
        setCarregandoFiliais(true)
        const [filiaisData, medicosData] = await Promise.all([
          loadFiliais(),
          loadMedicos()
        ])
        
        setFiliais(filiaisData)
        
        // Criar um mapa de ID da filial para nome da filial
        const novoFilialMap = new Map<number, string>()
        filiaisData.forEach(filial => {
          novoFilialMap.set(filial.id, filial.nome)
        })
        setFilialMap(novoFilialMap)
        
        setMedicos(medicosData)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        setAlert({
          open: true,
          message: 'Erro ao carregar dados. Tente novamente.',
          severity: 'error'
        })
      } finally {
        setCarregandoFiliais(false)
      }
    }

    buscarDados()
  }, [])
  
  // Efeito para buscar os dados de custos_os quando o mapa de filiais estiver pronto
  useEffect(() => {
    if (filialMap.size > 0) {
      buscarDados()
    }
  }, [filialMap])
  
  // Efeito para buscar os dados quando os filtros mudarem
  useEffect(() => {
    if (filialMap.size > 0) {
      buscarDados()
    }
  }, [filtros])

  const loadFiliais = async (): Promise<Filial[]> => {
    const { data, error } = await supabase
      .from('filiais')
      .select('id, nome')
      .order('nome')

    if (error) throw error
    return data || []
  }

  const loadMedicos = async (): Promise<Medico[]> => {
    const { data, error } = await supabase
      .from('medicos')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data || []
  }

  const loadCustosOS = async (): Promise<CustoOS[]> => {
    let query = supabase
      .from('custos_os')
      .select('*')

    // Aplicar filtros
    if (filtros.filial) {
      const filialId = [...filialMap.entries()]
        .find(([_, nome]) => nome === filtros.filial)?.[0]
      if (filialId) {
        query = query.eq('filial_id', filialId)
      }
    }

    if (filtros.dataInicial) {
      query = query.gte('data', filtros.dataInicial)
    }

    if (filtros.dataFinal) {
      query = query.lte('data', filtros.dataFinal)
    }

    query = query.order('data', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  const mapCustoOSToOS = (custoOS: CustoOS, filialNome: string): OS => ({
    id: custoOS.id,
    filial: filialNome,
    filial_id: custoOS.filial_id,
    data: custoOS.data,
    valorVenda: custoOS.valor_venda,
    custoLentes: custoOS.custo_lentes,
    custoArmacoes: custoOS.custo_armacoes,
    custoMkt: custoOS.custo_mkt,
    outrosCustos: custoOS.outros_custos,
    medico_id: custoOS.medico_id,
    numero_tco: custoOS.numero_tco
  })

  // Função para buscar dados com base nos filtros
  const buscarDados = async () => {
    try {
      setCarregandoOS(true)
      const custosData = await loadCustosOS()
      
      // Mapear os dados para o formato usado no componente
      const osData = custosData.map(custo => {
        let filialNome = filialMap.get(custo.filial_id)
        
        if (!filialNome) {
          const filial = filiais.find(f => f.id === custo.filial_id)
          filialNome = filial ? filial.nome : `Filial ${custo.filial_id}`
        }
        
        return mapCustoOSToOS(custo, filialNome)
      })
      
      setOsList(osData)
    } catch (error) {
      console.error('Erro ao buscar dados de custos de OS:', error)
      setAlert({
        open: true,
        message: 'Erro ao carregar dados de OS. Tente novamente.',
        severity: 'error'
      })
    } finally {
      setCarregandoOS(false)
    }
  }

  const formatDateToBrazilian = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getNomeMedico = (medicoId?: string) => {
    if (!medicoId) return 'Não informado'
    const medico = medicos.find(m => m.id === medicoId)
    return medico ? medico.nome : 'Médico não encontrado'
  }

  // Usar os dados já filtrados
  const osFiltradas = osList

  // Totais e indicadores
  const totalVendas = osFiltradas.reduce((acc, os) => acc + (os.valorVenda || 0), 0)
  const totalLentes = osFiltradas.reduce((acc, os) => acc + (os.custoLentes || 0), 0)
  const totalArmacoes = osFiltradas.reduce((acc, os) => acc + (os.custoArmacoes || 0), 0)
  const totalMkt = osFiltradas.reduce((acc, os) => acc + (os.custoMkt || 0), 0)
  const totalOutros = osFiltradas.reduce((acc, os) => acc + (os.outrosCustos || 0), 0)
  const margemBruta = totalVendas - (totalLentes + totalArmacoes + totalMkt + totalOutros)
  const totalOS = osFiltradas.length
  const totalArmacoesQtd = osFiltradas.length
  const margemMedia = totalOS ? margemBruta / totalOS : 0

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
  }

  // Função para desenhar tabela manualmente
  const drawTable = (doc: jsPDF, headers: string[], data: string[][], startY: number, title?: string) => {
    let yPos = startY
    const pageWidth = doc.internal.pageSize.width
    const margin = 14
    const tableWidth = pageWidth - (margin * 2)
    const colWidth = tableWidth / headers.length
    const rowHeight = 8
    
    // Título da tabela se fornecido
    if (title) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, yPos)
      yPos += 10
    }
    
    // Cabeçalho
    doc.setFillColor(41, 128, 185)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    
    doc.rect(margin, yPos, tableWidth, rowHeight, 'F')
    
    headers.forEach((header, index) => {
      const xPos = margin + (index * colWidth) + 2
      doc.text(header, xPos, yPos + 5)
    })
    
    yPos += rowHeight
    
    // Dados
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    
    data.forEach((row, rowIndex) => {
      // Alternar cor de fundo
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, yPos, tableWidth, rowHeight, 'F')
      }
      
      row.forEach((cell, colIndex) => {
        const xPos = margin + (colIndex * colWidth) + 2
        const cellText = cell.length > 15 ? cell.substring(0, 12) + '...' : cell
        doc.text(cellText, xPos, yPos + 5)
      })
      
      yPos += rowHeight
      
      // Verificar se precisa de nova página
      if (yPos > doc.internal.pageSize.height - 30) {
        doc.addPage()
        yPos = 20
      }
    })
    
    return yPos + 10
  }

  // Função para gerar PDF
  const handleGerarPDF = () => {
    try {
      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de OS', 14, 22)
      
      // Data de geração
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
      
      // Filtros aplicados
      let yPosition = 45
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Filtros Aplicados:', 14, yPosition)
      yPosition += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      if (filtros.filial) {
        doc.text(`• Filial: ${filtros.filial}`, 20, yPosition)
        yPosition += 6
      }
      
      if (filtros.dataInicial) {
        doc.text(`• Data Inicial: ${formatDateToBrazilian(filtros.dataInicial)}`, 20, yPosition)
        yPosition += 6
      }
      
      if (filtros.dataFinal) {
        doc.text(`• Data Final: ${formatDateToBrazilian(filtros.dataFinal)}`, 20, yPosition)
        yPosition += 6
      }
      
      if (!filtros.filial && !filtros.dataInicial && !filtros.dataFinal) {
        doc.text('• Nenhum filtro aplicado (todos os dados)', 20, yPosition)
        yPosition += 6
      }
      
      yPosition += 10
      
      // Resumo dos totais
      const resumoData = [
        ['Total de OS', totalOS.toString()],
        ['Valor Total das Vendas', `R$ ${totalVendas.toFixed(2)}`],
        ['Custo Total das Lentes', `R$ ${totalLentes.toFixed(2)}`],
        ['Custo Total das Armações', `R$ ${totalArmacoes.toFixed(2)}`],
        ['Custo Total do MKT', `R$ ${totalMkt.toFixed(2)}`],
        ['Custo Total "Outros"', `R$ ${totalOutros.toFixed(2)}`],
        ['Margem Bruta', `R$ ${margemBruta.toFixed(2)}`],
        ['Margem Média por OS', `R$ ${margemMedia.toFixed(2)}`]
      ]
      
      yPosition = drawTable(doc, ['Indicador', 'Valor'], resumoData, yPosition, 'Resumo Financeiro')
      
      // Detalhes das OS (apenas se houver dados)
      if (osFiltradas.length > 0) {
        yPosition += 10
        
        const osData = osFiltradas.map(os => [
          formatDateToBrazilian(os.data),
          os.filial.substring(0, 10),
          `R$ ${os.valorVenda.toFixed(0)}`,
          `R$ ${os.custoLentes.toFixed(0)}`,
          `R$ ${os.custoArmacoes.toFixed(0)}`,
          `R$ ${os.custoMkt.toFixed(0)}`,
          `R$ ${os.outrosCustos.toFixed(0)}`,
          getNomeMedico(os.medico_id).substring(0, 12),
          os.numero_tco?.substring(0, 8) || '-'
        ])
        
        drawTable(doc, ['Data', 'Filial', 'Venda', 'Lentes', 'Armação', 'MKT', 'Outros', 'Médico', 'TSO'], osData, yPosition, 'Detalhes das OS')
      }
      
      const nomeArquivo = `relatorio-os-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(nomeArquivo)
      
      setAlert({
        open: true,
        message: 'Relatório PDF gerado com sucesso!',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      setAlert({
        open: true,
        message: 'Erro ao gerar relatório PDF. Tente novamente.',
        severity: 'error'
      })
    }
  }

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false })
  }

  return (
    <Box>
      {/* Snackbar para feedback */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Typography variant="h4" gutterBottom color="primary">
        Relatório de OS
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filtros</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <FormControl fullWidth>
                <InputLabel id="filial-label">Filial</InputLabel>
                <Select
                  labelId="filial-label"
                  value={filtros.filial}
                  label="Filial"
                  onChange={(e) => setFiltros({ ...filtros, filial: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {carregandoFiliais ? (
                    <MenuItem disabled>
                      <Box display="flex" alignItems="center">
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Carregando filiais...
                      </Box>
                    </MenuItem>
                  ) : (
                    filiais.map(filial => 
                      <MenuItem key={filial.id} value={filial.nome}>{filial.nome}</MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField 
                label="Data Inicial" 
                name="dataInicial" 
                type="date" 
                value={filtros.dataInicial} 
                onChange={handleFiltroChange} 
                InputLabelProps={{ shrink: true }} 
                fullWidth 
              />
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField 
                label="Data Final" 
                name="dataFinal" 
                type="date" 
                value={filtros.dataFinal} 
                onChange={handleFiltroChange} 
                InputLabelProps={{ shrink: true }} 
                fullWidth 
              />
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: '250px', display: "flex", alignItems: "center" }}>
              <Button 
                variant="outlined" 
                startIcon={<PictureAsPdfIcon />} 
                onClick={handleGerarPDF} 
                sx={{ mt: { xs: 2, md: 0 } }}
                disabled={carregandoOS}
              >
                Gerar PDF
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>OS Filtradas</Typography>
          {carregandoOS ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {osFiltradas.length === 0 && (
                <Typography color="textSecondary">Nenhuma OS encontrada.</Typography>
              )}
              {osFiltradas.map(os => (
                <ListItem key={os.id} divider>
                  <ListItemText
                    primary={`${os.filial} - ${formatDateToBrazilian(os.data)}`}
                    secondary={
                      <>
                        <div>{`Venda: R$ ${os.valorVenda.toFixed(2)} | Lentes: R$ ${os.custoLentes.toFixed(2)} | Armação: R$ ${os.custoArmacoes.toFixed(2)} | MKT: R$ ${os.custoMkt.toFixed(2)} | Outros: R$ ${os.outrosCustos.toFixed(2)}`}</div>
                        <div style={{ marginTop: '4px', fontSize: '0.875rem', color: '#666' }}>
                          {`Médico: ${getNomeMedico(os.medico_id)}${os.numero_tco ? ` | TSO: ${os.numero_tco}` : ''}`}
                        </div>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1"><b>Totais e Indicadores</b></Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 1 }}>
            <Box>Valor total das vendas: <b>R$ {totalVendas.toFixed(2)}</b></Box>
            <Box>Custo total das lentes: <b>R$ {totalLentes.toFixed(2)}</b></Box>
            <Box>Custo total das armações: <b>R$ {totalArmacoes.toFixed(2)}</b></Box>
            <Box>Custo total do MKT: <b>R$ {totalMkt.toFixed(2)}</b></Box>
            <Box>Custo total "outros": <b>R$ {totalOutros.toFixed(2)}</b></Box>
            <Box>Margem bruta: <b>R$ {margemBruta.toFixed(2)}</b></Box>
            <Box>Total de OS: <b>{totalOS}</b></Box>
            <Box>Total de armações: <b>{totalArmacoesQtd}</b></Box>
            <Box>Margem média por OS: <b>R$ {margemMedia.toFixed(2)}</b></Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default RelatorioOS