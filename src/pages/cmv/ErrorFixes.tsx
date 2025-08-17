import React from 'react';

/**
 * Este arquivo contém funções para corrigir erros de referência que podem
 * ocorrer durante a execução do aplicativo devido a problemas de cache
 * ou inconsistências no navegador.
 */

interface WindowWithFunctions extends Window {
  [key: string]: any;
  handleCloseDialog?: () => void;
  handleDelete?: (id: number) => void;
  handleOpenDialog?: () => void;
  handleDialogIs?: () => void;
  handleToggleAtivo?: (id: number, ativo: boolean) => void;
  handleRemovePayment?: (id: number) => void;
  handleEditPayment?: (id: number) => void;
  handleDialogClose?: () => void;
  handlePaymentDialogClose?: () => void;
}

// Este script deve ser incluído em páginas que apresentam erros de referência
// para definir funções que possam estar sendo chamadas incorretamente
export const setupErrorFixes = () => {
  const win = window as WindowWithFunctions;
  
  // Função simples para definir funções de redirecionamento no objeto window
  const defineRedirect = (oldName: string, newName: string) => {
    if (typeof window !== 'undefined' && !window.hasOwnProperty(oldName)) {
      Object.defineProperty(window, oldName, {
        value: function(...args: any[]) {
          console.warn(`${oldName} foi chamado, mas está obsoleto. Use ${newName}`);
          
          if (typeof win[newName] === 'function') {
            return win[newName](...args);
          }
        },
        configurable: true
      });
    }
  };

  // Definir redirecionamentos para funções comuns que podem ser chamadas incorretamente
  defineRedirect('handleDialogClose', 'handleCloseDialog');
  defineRedirect('handleDelete$', 'handleDelete');
  defineRedirect('handleDialogIs', 'handleOpenDialog');
  defineRedirect('handleToggleAtivo$', 'handleToggleAtivo');
  defineRedirect('handleRemovePayment$', 'handleRemovePayment');
  defineRedirect('handleEditPayment$', 'handleEditPayment');
  defineRedirect('handleOpenPaymentDialog$', 'handleOpenPaymentDialog');
  defineRedirect('handlePaymentDialogClose$', 'handlePaymentDialogClose');
  defineRedirect('aplicarFiltros$', 'aplicarFiltros');
  defineRedirect('loadDespesas$', 'loadDespesas');
  defineRedirect('handleSavePayment$', 'handleSavePayment');
  defineRedirect('handleValorChange$', 'handleValorChange');
  defineRedirect('handleToggleStatus$', 'handleToggleStatus');
  defineRedirect('handleGerarPDF$', 'handleGerarPDF');
  defineRedirect('handleGenerateVencimentos$', 'handleGenerateVencimentos');
  defineRedirect('salvarDespesa$', 'salvarDespesa');
  
  // Adicione outras funções de redirecionamento conforme necessário
};


// Exporta um componente que pode ser usado para aplicar as correções
export const ErrorFixProvider = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    setupErrorFixes();
  }, []);

  return <>{children}</>;
};

export default setupErrorFixes;
