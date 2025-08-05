/**
 * Utilitários para formatação de data e hora no padrão brasileiro
 * Resolve problemas de UTC e padroniza formatos em todo o sistema
 */

// Configuração do timezone brasileiro (UTC-3)
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Converte uma data para o timezone brasileiro
 * @param date - Data a ser convertida
 * @returns Data no timezone brasileiro
 */
export const toBrazilianTimezone = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Se a data já tem timezone, mantém como está
  if (dateObj.toString().includes('GMT') || dateObj.toString().includes('UTC')) {
    return dateObj
  }
  
  // Para datas sem timezone, assume que estão em UTC e converte para horário brasileiro
  const utcDate = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000))
  return new Date(utcDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Formata data no padrão brasileiro (dd/mm/aaaa)
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export const formatarData = (date: Date | string): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const brazilianDate = toBrazilianTimezone(dateObj)
    
    return brazilianDate.toLocaleDateString('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
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
    const brazilianDate = toBrazilianTimezone(dateObj)
    
    return brazilianDate.toLocaleString('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
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
    const brazilianDate = toBrazilianTimezone(dateObj)
    
    return brazilianDate.toLocaleTimeString('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
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
    return formatarData(data)
  } catch (error) {
    console.error('Erro ao converter data ISO para BR:', error)
    return ''
  }
}

/**
 * Obtém a data atual no timezone brasileiro
 * @returns Data atual
 */
export const getDataAtual = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Obtém a data atual no formato ISO (aaaa-mm-dd)
 * @returns String da data atual
 */
export const getDataAtualISO = (): string => {
  return getDataAtual().toISOString().split('T')[0]
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
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const brazilianDate = toBrazilianTimezone(dateObj)
  
  const diasSemana = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 
    'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
  ]
  
  return diasSemana[brazilianDate.getDay()]
}

/**
 * Formata data com dia da semana (dd/mm/aaaa - Dia da semana)
 * @param date - Data a ser formatada
 * @returns String formatada
 */
export const formatarDataComDiaSemana = (date: Date | string): string => {
  const dataFormatada = formatarData(date)
  const diaSemana = getDiaSemana(date)
  return `${dataFormatada} - ${diaSemana}`
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