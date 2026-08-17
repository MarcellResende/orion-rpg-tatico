export function SetupRequired() {
  return (
    <div className="gateway-shell">
      <div className="gateway-panel setup-panel">
        <div className="gateway-brand">
          <span className="brand-mark" aria-hidden="true">O</span>
          <div>
            <span className="eyebrow">ORION // CONFIGURAÇÃO INICIAL</span>
            <h1>Conecte o banco para entrar online</h1>
          </div>
        </div>
        <p className="gateway-lead">
          O site está pronto, mas precisa das duas chaves públicas do seu projeto Supabase.
        </p>
        <ol className="setup-steps">
          <li><span>01</span><div><strong>Crie o projeto no Supabase</strong><p>Use o plano gratuito e guarde a senha do banco.</p></div></li>
          <li><span>02</span><div><strong>Execute a configuração do banco</strong><p>Copie o arquivo SQL indicado no guia para o SQL Editor.</p></div></li>
          <li><span>03</span><div><strong>Crie o arquivo .env.local</strong><p>Cole a URL e a Publishable Key do projeto.</p></div></li>
          <li><span>04</span><div><strong>Reinicie o site</strong><p>Execute novamente npm run dev ou gere o build da Netlify.</p></div></li>
        </ol>
        <div className="gateway-callout">
          Abra <b>GUIA_PUBLICACAO.md</b> na pasta do projeto. Ele descreve cada clique, sem exigir conhecimento de programação.
        </div>
      </div>
    </div>
  )
}
