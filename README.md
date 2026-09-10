# ORION — Sistema online de campanha para RPG Tático

Aplicação React + TypeScript para fichas sincronizadas do RPG Tático. O mestre cria uma campanha, compartilha um código com os jogadores e acompanha o esquadrão em tempo real.

## O que esta versão faz

- cadastro e login por e-mail e senha;
- criação de campanha pelo mestre;
- entrada dos jogadores por código de 8 caracteres;
- ficha individual salva no Supabase;
- painel do mestre com todos os operadores;
- controles rápidos de PV, Energia e Estresse;
- oito condições oficiais do manual, com remoção exclusiva do mestre;
- inventário com catálogo completo do manual, quantidade, peso e efeitos automáticos;
- medidor de carga de 0% a 200%, com limite calculado e penalidades automáticas por sobrecarga;
- armas com munição no pente, modos de disparo, pentes reserva e recarga;
- proteções equipáveis que atualizam a Defesa imediatamente;
- subperícias oficiais e especializações livres com orçamento próprio;
- bônus automáticos de função, traço e equipamento sem consumir pontos distribuídos;
- aba de anotações do operador;
- progressão individual por XP, níveis 1 a 10 e recompensas automáticas;
- encerramento de missão pelo mestre com seleção dos feitos e participantes;
- salvamento serializado que preserva texto digitado enquanto uma resposta anterior está em trânsito;
- atualização do painel em tempo real;
- permissões de banco com Row Level Security: jogador vê somente a própria ficha;
- layout responsivo para computador e celular;
- configuração pronta para Netlify.

## Comece por aqui

Siga o [GUIA_PUBLICACAO.md](./GUIA_PUBLICACAO.md). Ele explica a configuração do Supabase e a publicação na Netlify passo a passo.

Depois que o arquivo `.env.local` estiver configurado:

```text
npm install
npm run dev
```

Validação:

```text
npm test
npm run build
```

## Regras automatizadas

- PV máximo: `20 + Constituição × 5`.
- Energia máxima: `10 + Destreza × 3`.
- Defesa: `10 + proteção equipada + outros modificadores`.
- Compostura máxima: `5 + Vontade + Inteligência`.
- Estresse máximo: `6`.
- Pontos de perícia: `10 + Inteligência`.
- Atributos disponíveis: `6`.
- Carga base: `15 kg + (Força total × 5 kg)`.
- Carga máxima absoluta: `200% da carga base`.

## Experiência e níveis

O XP é individual. No painel do esquadrão, o mestre marca os feitos da missão e seleciona os operadores participantes; o sistema concede até `6 XP` por missão para cada selecionado. O nível é calculado automaticamente pelos marcos `0, 4, 9, 15, 22, 30, 39, 49, 60 e 72 XP`.

As recompensas de `+1 Perícia` ampliam automaticamente a reserva de pontos. Os níveis 3, 6 e 9 também aumentam a reserva de atributos. Habilidades Gerais, Especialização da Função, Treinamento Veterano e Habilidade Máxima possuem campos próprios na aba **Progressão**.

Os bônus de atributos e perícias principais de função, traço e equipamento são somados automaticamente e exibidos separados dos pontos distribuídos. A sobrecarga aplica automaticamente as penalidades de Furtividade, Tolerância, custo de Energia e deslocamento. A capacidade usa apenas a regra da ficha: `15 kg` iniciais e `+5 kg` por ponto de Força total.

Cada ponto total em Combate gera 2 pontos de subperícia. As demais perícias geram 1 ponto de especialização por ponto total. O total inclui os pontos distribuídos e os bônus gratuitos de função, traço e equipamento; por exemplo, Tecnologia `6 + 2` libera `8` pontos de especialização.

Uma campanha criada pelo mestre começa sem fichas. A ficha do mestre só é criada quando ele usa **Criar minha ficha**; cada jogador cria apenas a própria ficha ao abrir a campanha pela primeira vez.

## Como a hospedagem funciona

O GitHub guarda o código-fonte. Cada atualização enviada para a branch `main` solicita uma nova publicação automática ao Netlify, que mantém o site acessível mesmo com o computador do mestre desligado. O Supabase é separado da hospedagem: ele guarda contas, campanhas, fichas e alterações em tempo real. Durante o RPG, o mestre cria a campanha, compartilha o código de convite e os jogadores entram pelo mesmo endereço do site.

## Atualização obrigatória do Supabase

Projetos que já executaram a primeira migração também devem executar:

```text
supabase/migrations/002_secure_conditions.sql
```

Ela restringe a leitura das fichas, cria as condições protegidas e ativa sua atualização em tempo real.



## Manual v1.4 e expansões

O PDF base atual está em `public/Manual_Operador_v1.4.pdf`; a aba Manual oferece busca no texto completo. Fórmulas de PV/Energia, limites de atributos, proteção, disparos e bônus diretos de equipamento foram ajustados à v1.4. Regras situacionais continuam dependendo do contexto da mesa.

A aba **Expansões** ativa módulos por operador. Atributos entram no bloco normal da ficha, regras na consulta e equipamentos no arsenal. Seleção e valores são salvos no JSON da ficha, sem migração de banco adicional. Desativar preserva os dados, suspende efeitos e peso; reativar respeita espaços de equipamento já ocupados.

**Assassin’s Creed v1.5.1** está disponível, desativada por padrão. Ative-a em **Expansões** na ficha desejada. Ela acrescenta Mobilidade, seis funções históricas, subperícias, escolas de combate e equipamentos por era. Não acrescenta atributos nem um orçamento extra de pontos.

Em **Condições e inventário**, o painel da expansão registra Fluxo, Suspeita, Credibilidade, perseguição, Dossiê, posturas, escolas e modificações das duas Lâminas Ocultas. Proteção usa RA, teto de Fluxo e penalidades de movimento conforme o PDF. As proteções do livro base ficam preservadas e suspensas durante a ativação. Pesos não especificados no PDF precisam ser informados com o Mestre ao adicionar o equipamento.

O painel do Mestre oferece os registros coletivos da Irmandade quando há uma ficha com a expansão ativa. Regras situacionais, autorização de protótipos, recompensas e efeitos que dependem da cena continuam sob controle da mesa; os textos completos e as páginas do PDF estão na consulta do manual. Dados individuais e coletivos usam os campos JSON existentes do Supabase.

Ao enviar um próximo PDF ao agente, escreva **“Este PDF é uma expansão: [nome]”**. O conteúdo será lido e integrado em `src/data/expansions.ts`, conforme `AGENTS.md`, e então aparecerá no seletor. O site não interpreta PDFs arbitrários automaticamente. Modificadores previstos pelo contrato são calculados; novas mecânicas exigem implementação específica. Atributos adicionais usam o orçamento próprio estabelecido pelo respectivo PDF.

Validação: testes cobrem integração na ficha/arsenal/manual, várias expansões, limites, persistência, reativação e conflito de armadura. A verificação visual usa apenas dados de teste locais.
