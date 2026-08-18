import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  failed: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha inesperada no terminal de campo.', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="app-recovery" role="alert">
        <span className="brand-mark" aria-hidden="true">O</span>
        <span className="eyebrow">ORION // RECUPERAÇÃO DO TERMINAL</span>
        <h1>A tela encontrou um erro inesperado</h1>
        <p>Sua ficha continua salva. Recarregue para recuperar a conexão com a campanha.</p>
        <button type="button" className="primary-button" onClick={() => window.location.reload()}>
          Recarregar tela
        </button>
      </main>
    )
  }
}
