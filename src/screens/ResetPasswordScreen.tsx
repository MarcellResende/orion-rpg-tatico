import { useState, type FormEvent } from 'react'
import { requireSupabase } from '../lib/supabase'

interface ResetPasswordScreenProps {
  onComplete: () => void | Promise<void>
}

export function ResetPasswordScreen({ onComplete }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmation) {
      setError('As duas senhas precisam ser iguais.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser({ password })
      if (updateError) throw updateError
      setCompleted(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível alterar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gateway-shell">
      <div className="gateway-panel password-reset-panel">
        <div className="gateway-brand">
          <span className="brand-mark" aria-hidden="true">O</span>
          <div>
            <span className="eyebrow">ORION // RECUPERAÇÃO SEGURA</span>
            <h1>Definir nova senha</h1>
          </div>
        </div>

        {completed ? (
          <div className="password-reset-success">
            <div className="form-message form-message--success" role="status">
              Senha alterada com sucesso. Agora você já pode entrar novamente.
            </div>
            <button type="button" className="primary-button" onClick={() => void onComplete()}>
              Ir para a tela de entrada
            </button>
          </div>
        ) : (
          <form className="gateway-form password-reset-form" onSubmit={submit}>
            <p className="password-recovery-lead">Escolha uma senha nova para sua conta.</p>
            <label>
              <span>Nova senha</span>
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
                autoComplete="new-password"
                placeholder="Mínimo de 6 caracteres"
              />
            </label>
            <label>
              <span>Confirmar nova senha</span>
              <input
                type="password"
                minLength={6}
                value={confirmation}
                onChange={(event) => setConfirmation(event.currentTarget.value)}
                required
                autoComplete="new-password"
                placeholder="Digite a mesma senha"
              />
            </label>

            {error && <div className="form-message form-message--error" role="alert">{error}</div>}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Alterando senha...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
