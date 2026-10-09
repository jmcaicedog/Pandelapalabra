import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error al mostrar la aplicación:', error, info.componentStack);
  }

  render() {
    if (this.state.failed) return (
      <main role="alert" className="min-h-screen bg-slate-950 text-white p-8">
        <h1>No se pudo mostrar la aplicación.</h1>
        <p>Recarga para reintentar. Tus datos guardados no se han eliminado.</p>
        <button className="mt-4 underline" onClick={() => location.reload()}>Recargar</button>
      </main>
    );
    return this.props.children;
  }
}
