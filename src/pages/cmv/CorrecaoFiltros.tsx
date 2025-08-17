// Funções utilitárias para corrigir problemas de parsing nos filtros

/**
 * Converte um valor para número de forma segura, retornando null se inválido
 * @param value Valor a ser convertido para número
 * @returns Número ou null se não for possível converter
 */
export const parseNumberSafely = (value: any): number | null => {
  if (value === undefined || value === null) return null;
  
  // Se já for número, retorna o próprio valor
  if (typeof value === 'number') return value;
  
  // Se for string, tenta converter para número
  if (typeof value === 'string') {
    // Remover caracteres não numéricos (exceto ponto decimal)
    const cleanedValue = value.replace(/[^\d.]/g, '');
    const parsedValue = parseFloat(cleanedValue);
    return !isNaN(parsedValue) ? parsedValue : null;
  }
  
  return null;
};

/**
 * Verifica se dois valores são iguais, considerando valores numéricos de forma segura
 * @param value1 Primeiro valor
 * @param value2 Segundo valor
 * @returns true se os valores forem iguais, false caso contrário
 */
export const safelyCompareValues = (value1: any, value2: any): boolean => {
  // Se ambos forem undefined ou null, são iguais
  if ((value1 === null && value2 === null) || 
      (value1 === undefined && value2 === undefined)) {
    return true;
  }
  
  // Se apenas um for null/undefined, são diferentes
  if (value1 === null || value1 === undefined || 
      value2 === null || value2 === undefined) {
    return false;
  }
  
  // Tentar converter para números e comparar
  const num1 = parseNumberSafely(value1);
  const num2 = parseNumberSafely(value2);
  
  // Se ambos forem números válidos, comparar os números
  if (num1 !== null && num2 !== null) {
    return num1 === num2;
  }
  
  // Se não for possível comparar como números, comparar como strings
  return String(value1).toLowerCase() === String(value2).toLowerCase();
};

/**
 * Verifica se um valor é um dos valores na lista
 * @param value Valor a ser verificado
 * @param validValues Lista de valores válidos
 * @returns true se o valor estiver na lista, false caso contrário
 */
export const isValidValue = (value: any, validValues: any[]): boolean => {
  if (value === undefined || value === null) return false;
  
  return validValues.some(validValue => safelyCompareValues(value, validValue));
};
