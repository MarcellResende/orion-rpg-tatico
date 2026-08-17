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
- inventário com quantidade, peso e observações;
- bônus automáticos de função e traço sem consumir pontos distribuídos;
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

- PV máximo: `20 + Constituição × 10`.
- Energia máxima: `10 + Destreza × 5`.
- Defesa base: `10`.
- Compostura máxima: `5 + Vontade + Inteligência`.
- Estresse máximo: `6`.
- Pontos de perícia: `10 + Inteligência`.
- Atributos disponíveis: `6`.

Os bônus de atributos e perícias principais de função e traço são somados automaticamente e exibidos separados dos pontos distribuídos. Bônus situacionais continuam identificados na descrição. A ficha calcula o peso total do inventário, mas o limite de carga permanece sob decisão do mestre porque o manual apresenta versões conflitantes baseadas em Força e Tolerância.

## Atualização obrigatória do Supabase

Projetos que já executaram a primeira migração também devem executar:

```text
supabase/migrations/002_secure_conditions.sql
```

Ela restringe a leitura das fichas, cria as condições protegidas e ativa sua atualização em tempo real.
