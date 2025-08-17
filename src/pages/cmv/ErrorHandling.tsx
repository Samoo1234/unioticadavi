import React from 'react';

/**
 * Componente wrapper para capturar e tratar erros de renderização em componentes React
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback?: React.ReactNode },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Atualiza o state para que a próxima renderização mostre a UI alternativa
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error('Erro capturado pelo boundary:', error);
    console.error('Componente stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI alternativa
      return this.props.fallback || (
        <div style={{ 
          padding: '20px', 
          margin: '10px', 
          border: '1px solid #f44336',
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}>
          <h3>Erro na renderização do componente</h3>
          <p>Ocorreu um erro ao renderizar este componente. Detalhes:</p>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            {this.state.error?.message || 'Erro desconhecido'}
          </pre>
          <p>Tente atualizar a página ou contate o suporte se o problema persistir.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
