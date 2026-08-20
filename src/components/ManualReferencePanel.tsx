const VEHICLES = [
  ['Zodiac / RHIB', '0', '20', '30', '80 km/h', '8'],
  ['Lancha de Patrulha', '4', '50', '80', '90 km/h', '6'],
  ['Jet Ski', '1', '15', '25', '110 km/h', '2'],
  ['Little Bird', '2', '40', '60', '250 km/h', '2 + 4'],
  ['UH-60 Tático', '5', '60', '100', '300 km/h', '4 + 10'],
  ['Cessna Tático', '1', '30', '50', '350 km/h', '1 + 3'],
  ['Quadriciclo / Moto', '0', '15', '20', '120 km/h', '2'],
  ['Jipe Leve', '3', '30', '50', '140 km/h', '4'],
  ['SUV Blindada', '6', '40', '80', '160 km/h', '5'],
  ['LSV', '1', '25', '40', '130 km/h', '4'],
  ['Caminhão Tático', '8', '60', '120', '90 km/h', '2 + 10'],
  ['MRAP', '12', '70', '130', '90 km/h', '2 + 6'],
  ['APC Stryker / Urutu', '10', '80', '150', '100 km/h', '2 + 9'],
]

const ENEMIES = [
  ['Sicário Comum', '1', '15', '8', '12', '+2', '2'],
  ['Sicário de CQB', '1', '18', '10', '12', '+3', '2'],
  ['Sicário Veterano', '2', '22', '12', '14', '+4', '3'],
  ['Sicário Atirador', '2', '15', '10', '12', '+3', '2'],
  ['Sicário Artilheiro', '2', '25', '15', '14', '+2', '3'],
  ['Sicário Demolidor', '2', '18', '12', '12', '+3', '2'],
  ['Chefe de Célula', '3', '25', '15', '14', '+4', '4'],
  ['Guarda Desprevenido', '1', '12', '6', '10', '+1', '1'],
]

export function ManualReferencePanel() {
  return (
    <section className="panel manual-reference" aria-labelledby="manual-reference-heading">
      <div className="panel-heading"><div><span className="section-index">REF</span><h2 id="manual-reference-heading">Referência do Manual v1.1</h2></div><span className="panel-code">39 PÁGINAS</span></div>
      <p className="panel-intro">Consulta rápida das regras que não dependem de um campo editável da ficha. Habilidades, condições, equipamentos, progressões e QG ficam nas suas abas próprias.</p>

      <div className="reference-grid">
        <details open>
          <summary>Teste padrão, DT e Teto de Bônus</summary>
          <div className="reference-content">
            <strong>1d20 + Subperícia + Atributo + Equipamento + Habilidade</strong>
            <p>A Perícia Principal fornece e organiza pontos; não é somada novamente. Some bônus positivos, limite em <b>10 + Nível</b> e só então subtraia penalidades. A DT é escondida.</p>
            <div className="reference-chips"><span>5 Rotineira</span><span>8 Fácil</span><span>10 Tensão</span><span>12 Difícil</span><span>15 Combate</span><span>17 Muito difícil</span><span>20 Extrema</span></div>
          </div>
        </details>

        <details>
          <summary>Ações, movimento, alcance e cobertura</summary>
          <div className="reference-content">
            <p>Por turno: 1 Ação Padrão, 1 Secundária, 1 Movimento e até 2 Meias Ações (-3 m cada). Reação: 1 por rodada. Deslocamento base: 9 m.</p>
            <div className="reference-chips"><span>Curto 10 m</span><span>Médio 20 m</span><span>Longo 50 m</span><span>Extremo 100 m</span><span>Meia Cobertura +2 DEF</span><span>Total +4 DEF</span></div>
            <p>Iniciativa = 1d20 + Destreza. Defesa = 10 + Colete + Cobertura + Habilidades, sem teto. Redução de dano pode chegar a 0.</p>
          </div>
        </details>

        <details>
          <summary>Disparos, recargas e Aguardar Ângulo</summary>
          <div className="reference-content">
            <ul><li>Semiautomático: 1 tiro e +1 no ataque.</li><li>Rajada curta: 3 tiros; após o primeiro, -1 cumulativo.</li><li>Automático focado: 4–10 tiros; -1 por tiro após o primeiro e -2 por tiro depois do quinto.</li><li>Varredura: 4–10 tiros contra até 3 alvos; um teste com -3.</li></ul>
            <p>Recarga Tática: Ação Padrão e preserva o carregador. Rápida: Movimento e descarta a munição restante. Carregador estendido aumenta os custos. Aguardar Ângulo usa a Reação contra o primeiro inimigo que cruza a linha coberta.</p>
          </div>
        </details>

        <details>
          <summary>0 PV, estabilização e descanso</summary>
          <div className="reference-content">
            <p>Em 0 PV, fica Inconsciente e há 3 turnos para estabilizar. Estabilizar: Ação Padrão + Primeiros Socorros DT 15. Sem estabilização ao fim do terceiro turno, morre.</p>
            <p>Descanso Curto (1–2 h): +5 EN, sem PV natural. Longo (6–8 h): EN máxima e +5 PV em ambiente seguro. Hidratação é obrigatória; EN não se recupera em combate.</p>
          </div>
        </details>

        <details>
          <summary>Estresse e recuperação mental</summary>
          <div className="reference-content">
            <p>0–2 Controlado; 3–4: -1 Comunicação/Exploração; 5: -2; 6: Visão de Túnel. Novo Estresse em 6 exige Vontade DT 15 ou Colapso Tático. Queimar Adrenalina concede rerrolagem por +2 Estresse.</p>
            <p>Jogos (1 h): -1 Estresse de até 3 operadores. Exercício: -2 Estresse e Fadiga Leve. Hobby (2 h): -2 Estresse e +1 Compostura. Prato Favorito: -3 Estresse, +2 Compostura e Inspirado.</p>
          </div>
        </details>

        <details>
          <summary>Duelo Social, Alerta e Heat</summary>
          <div className="reference-content">
            <p>Defesa Social = 10 + Vontade. Ataque social usa a fórmula normal. Sucesso causa 1 CP; margem 5+: 2 CP; margem 10+: 3 CP; 20 natural acrescenta +1 CP. Ruptura em 0 CP não é controle mental.</p>
            <div className="reference-chips"><span>Verde: desprevenido</span><span>Amarelo: +3 Percepção</span><span>Vermelho: combate/caçada</span><span>Heat 0–5 persistente</span></div>
          </div>
        </details>

        <details>
          <summary>Drones e guerra eletrônica</summary>
          <div className="reference-content"><p>Pilotar drone consome Ação Padrão e reduz a percepção do entorno. Marcar até 3 alvos consome Ação Secundária e concede +2 aos ataques aliados quando há visão compartilhada. A menos de 5 m, Percepção inimiga pode disputar com Pilotagem para detectar o drone.</p></div>
        </details>

        <details>
          <summary>Veículos</summary>
          <div className="reference-content reference-table"><div className="reference-row reference-row--head"><b>Veículo</b><b>RD</b><b>Motor</b><b>Chassi</b><b>Vel.</b><b>Cap.</b></div>{VEHICLES.map((row) => <div className="reference-row" key={row[0]}>{row.map((value, index) => <span key={index}>{value}</span>)}</div>)}</div>
        </details>

        <details>
          <summary>Inimigos padrão</summary>
          <div className="reference-content reference-table"><div className="reference-row reference-row--head"><b>Inimigo</b><b>Nível</b><b>PV</b><b>EN</b><b>DEF</b><b>Ini.</b><b>Moral</b></div>{ENEMIES.map((row) => <div className="reference-row reference-row--enemy" key={row[0]}>{row.map((value, index) => <span key={index}>{value}</span>)}</div>)}</div>
        </details>
      </div>
    </section>
  )
}
