/**
 * Utilitários para formatação de data e hora no padrão brasileiro
 * Resolve problemas de UTC e padroniza formatos em todo o sistema
 */

/**
 * Formata data no padrão brasileiro (dd/mm/aaaa)
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export const formatarData = (date: Date | string): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
    
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date)
      return ''
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return ''
  }
}

/**
 * Formata data e hora no padrão brasileiro (dd/mm/aaaa HH:mm)
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export const formatarDataHora = (date: Date | string): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date)
      return ''
    }
    
    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error)
    return ''
  }
}

/**
 * Formata apenas a hora no padrão brasileiro (HH:mm)
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export const formatarHora = (date: Date | string): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date)
      return ''
    }
    
    return dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Erro ao formatar hora:', error)
    return ''
  }
}

/**
 * Converte data do formato brasileiro (dd/mm/aaaa) para ISO (aaaa-mm-dd)
 * @param dataBR - Data no formato brasileiro
 * @returns Data no formato ISO
 */
export const dataBRParaISO = (dataBR: string): string => {
  if (!dataBR) return ''
  
  try {
    const [dia, mes, ano] = dataBR.split('/').map(Number)
    const data = new Date(ano, mes - 1, dia)
    
    if (isNaN(data.getTime())) {
      console.error('Data BR inválida:', dataBR)
      return ''
    }
    
    return data.toISOString().split('T')[0]
  } catch (error) {
    console.error('Erro ao converter data BR para ISO:', error)
    return ''
  }
}

/**
 * Converte data do formato ISO (aaaa-mm-dd) para brasileiro (dd/mm/aaaa)
 * @param dataISO - Data no formato ISO
 * @returns Data no formato brasileiro
 */
export const dataISOParaBR = (dataISO: string): string => {
  if (!dataISO) return ''
  
  try {
    const data = new Date(dataISO + 'T00:00:00')
    
    if (isNaN(data.getTime())) {
      console.error('Data ISO inválida:', dataISO)
      return ''
    }
    
    return formatarData(data)
  } catch (error) {
    console.error('Erro ao converter data ISO para BR:', error)
    return ''
  }
}

/**
 * Obtém a data atual
 * @returns Data atual
 */
export const getDataAtual = (): Date => {
  return new Date()
}

/**
 * Obtém a data atual no formato ISO (aaaa-mm-dd)
 * @returns String da data atual
 */
export const getDataAtualISO = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Obtém a data atual no formato brasileiro (dd/mm/aaaa)
 * @returns String da data atual
 */
export const getDataAtualBR = (): string => {
  return formatarData(getDataAtual())
}

/**
 * Verifica se uma data é válida
 * @param date - Data a ser verificada
 * @returns true se a data é válida
 */
export const isDataValida = (date: Date | string): boolean => {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return !isNaN(dateObj.getTime())
  } catch (error) {
    return false
  }
}

/**
 * Adiciona dias a uma data
 * @param date - Data base
 * @param dias - Número de dias a adicionar
 * @returns Nova data
 */
export const adicionarDias = (date: Date | string, dias: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const novaData = new Date(dateObj)
  novaData.setDate(novaData.getDate() + dias)
  return novaData
}

/**
 * Subtrai dias de uma data
 * @param date - Data base
 * @param dias - Número de dias a subtrair
 * @returns Nova data
 */
export const subtrairDias = (date: Date | string, dias: number): Date => {
  return adicionarDias(date, -dias)
}

/**
 * Obtém o dia da semana em português
 * @param date - Data
 * @returns Nome do dia da semana
 */
export const getDiaSemana = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
    
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida para calcular dia da semana:', date)
      return 'Data inválida'
    }
    
    const diasSemana = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ]
    
    return diasSemana[dateObj.getDay()]
  } catch (error) {
    console.error('Erro ao calcular dia da semana:', error)
    return 'Erro'
  }
}

/**
 * Formata data com dia da semana (dd/mm/aaaa - Dia da semana)
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export const formatarDataComDiaSemana = (date: Date | string): string => {
  const dataFormatada = formatarData(date)
  const diaSemana = getDiaSemana(date)
  
  if (dataFormatada && diaSemana && diaSemana !== 'Data inválida' && diaSemana !== 'Erro') {
    return `${dataFormatada} - ${diaSemana}`
  }
  
  return dataFormatada || 'Data inválida'
}

/**
 * Converte string de hora (HH:mm) para minutos desde meia-noite
 * @param hora - String da hora no formato HH:mm
 * @returns Minutos desde meia-noite
 */
export const horaParaMinutos = (hora: string): number => {
  if (!hora) return 0
  
  try {
    const [horas, minutos] = hora.split(':').map(Number)
    return (horas * 60) + minutos
  } catch (error) {
    console.error('Erro ao converter hora para minutos:', error)
    return 0
  }
}

/**
 * Converte minutos desde meia-noite para string de hora (HH:mm)
 * @param minutos - Minutos desde meia-noite
 * @returns String da hora no formato HH:mm
 */
export const minutosParaHora = (minutos: number): string => {
  if (minutos < 0) return '00:00'
  
  try {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Erro ao converter minutos para hora:', error)
    return '00:00'
  }
} 