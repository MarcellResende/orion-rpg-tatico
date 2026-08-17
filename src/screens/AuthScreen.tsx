import { useState, type FormEvent } from 'react'
import { requireSupabase } from '../lib/supabase'

type AuthMode = 'login' | 'register'

const friendlyAuthError = (message: string) => {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (normalized.includes('email not confirmed')) return 'Confirme o e-mail recebido antes de entrar.'
  if (normalized.includes('already registered')) return 'Este e-mail já possui uma conta.'
  if (normalized.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return message
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const client = requireSupabase()
      if (mode === 'login') {
        const { error: authError } = await client.auth.signInWithPassword({ email, password })
        if (authError) throw authError
      } else {
        const { data, error: authError } = await client.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } },
        })
        if (authError) throw authError
        if (!data.session) {
          setMessage('Conta criada. Abra o e-mail de confirmação enviado pelo Supabase e depois volte para entrar.')
        }
      }
    } catch (caught) {
      setError(friendlyAuthError(caught instanceof Error ? caught.message : 'Não foi possível entrar.'))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  return (
    <div className="gateway-shell auth-shell">
      <div className="auth-briefing">
        <span className="eyebrow">SISTEMA DE COMANDO TÁTICO</span>
        <h1>Todo o esquadrão.<br />Uma única operação.</h1>
        <p>Fichas sincronizadas, recursos visíveis e controle rápido para o mestre conduzir a sessão sem perder tempo.</p>
        <div className="briefing-points">
          <span><b>01</b> Crie ou entre na campanha</span>
          <span><b>02</b> Monte sua ficha de operador</span>
          <span><b>03</b> Jogue com atualização em tempo real</span>
        </div>
      </div>

      <div className="gateway-panel auth-panel">
        <div className="gateway-brand">
          <span className="brand-mark" aria-hidden="true">O</span>
          <div>
            <span className="eyebrow">ORION // ACESSO SEGURO</span>
            <h2>{mode === 'login' ? 'Entrar na operação' : 'Criar credencial'}</h2>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de acesso">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>Entrar</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>Criar conta</button>
        </div>

        <form className="gateway-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              <span>Como quer ser chamado</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} required placeholder="Seu nome" />
            </label>
          )}
          <label>
            <span>E-mail</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required autoComplete="email" placeholder="voce@email.com" />
          </label>
          <label>
            <span>Senha</span>
            <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.currentTarget.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo de 6 caracteres" />
          </label>

          {error && <div className="form-message form-message--error" role="alert">{error}</div>}
          {message && <div className="form-message form-message--success" role="status">{message}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <p className="privacy-note">Cada usuário acessa somente as campanhas das quais participa.</p>
      </div>
    </div>
  )
}
