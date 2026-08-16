# Guia simples: colocar o ORION online

Este guia foi escrito para quem nunca programou. Você fará a configuração uma única vez. Depois disso, para jogar, basta abrir o endereço da Netlify.

## Antes de começar

Você precisa de:

- uma conta gratuita no [Supabase](https://supabase.com/);
- uma conta gratuita na [Netlify](https://www.netlify.com/);
- Node.js instalado no computador;
- esta pasta do projeto.

Não coloque no site a senha do banco nem uma chave `service_role`. O sistema utiliza somente a `Publishable key` pública, protegida pelas regras RLS do banco.

## 1. Criar o banco no Supabase

1. Entre em [Supabase Dashboard](https://supabase.com/dashboard).
2. Clique em **New project**.
3. Escolha um nome, por exemplo `rpg-tatico`.
4. Crie e guarde a senha do banco. Ela não será colocada no site.
5. Escolha a região mais próxima dos jogadores e clique em **Create new project**.
6. Aguarde o projeto terminar de ser preparado.

## 2. Criar as tabelas e permissões

1. No menu esquerdo do Supabase, abra **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase/migrations/001_online_campaigns.sql` desta pasta.
4. Copie todo o conteúdo do arquivo e cole no SQL Editor.
5. Clique em **Run**.
6. A mensagem final deve indicar sucesso. Esse comando cria campanhas, participantes, fichas, permissões e tempo real.

Execute esse arquivo apenas uma vez em cada projeto Supabase.

## 3. Copiar as duas informações públicas

1. No Supabase, clique em **Connect** no topo do projeto.
2. Procure a seção de API/Client.
3. Copie a **Project URL**.
4. Copie a **Publishable key**. Se o painel mostrar apenas `anon key`, ela também funciona.
5. Não copie a `service_role key`.

## 4. Configurar o projeto no computador

Na pasta `rpg`, crie uma cópia do arquivo `.env.example` com o nome `.env.local`.

Uma forma fácil no Prompt de Comando:

```text
copy .env.example .env.local
notepad .env.local
```

No Bloco de Notas, substitua os exemplos pelos valores copiados do Supabase:

```text
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Salve e feche o arquivo. Nunca envie o `.env.local` para outras pessoas.

## 5. Testar antes de publicar

No Prompt de Comando aberto na pasta do projeto, execute:

```text
npm install
npm run dev
```

Abra o endereço exibido, normalmente `http://localhost:5173`.

Você deve ver a tela de login. Se aparecer a tela “Conecte o banco”, confira o nome do arquivo `.env.local` e reinicie `npm run dev`.

## 6. Publicar na Netlify sem usar GitHub

1. Pare o site local pressionando `Ctrl+C` no terminal.
2. Gere a versão de publicação:

```text
npm run build
```

3. Uma pasta chamada `dist` será criada ou atualizada.
4. Entre no [Netlify Drop](https://app.netlify.com/drop) com sua conta.
5. Arraste somente a pasta `dist` para a área indicada.
6. A Netlify fornecerá um endereço parecido com `https://nome-do-site.netlify.app`.

As chaves públicas do Supabase já foram incluídas no build local. O arquivo `_redirects` também está dentro de `dist`, evitando erro 404 ao recarregar o site.

## 7. Autorizar o endereço da Netlify no Supabase

1. Volte ao Supabase.
2. Abra **Authentication** e depois **URL Configuration**.
3. Em **Site URL**, coloque o endereço exato fornecido pela Netlify, sem barra no final.
4. Em **Redirect URLs**, adicione:

```text
http://localhost:5173/**
https://SEU-SITE.netlify.app/**
```

5. Salve.

Isso garante que a confirmação de e-mail leve os jogadores de volta ao seu site.

## 8. Preparar a primeira sessão

### Mestre

1. Abra o site da Netlify.
2. Clique em **Criar conta**.
3. Confirme o e-mail recebido.
4. Entre e use **Criar como mestre**.
5. Copie o código de oito caracteres exibido no Escudo do Mestre.
6. Envie o endereço do site e o código aos jogadores.

### Jogadores

1. Abrem o mesmo endereço da Netlify.
2. Criam e confirmam suas próprias contas.
3. Usam **Entrar como jogador** e digitam o código do mestre.
4. Preenchem a ficha. O salvamento é automático.

O mestre verá os operadores no painel assim que eles abrirem a campanha. PV, Energia e Estresse podem ser alterados rapidamente no Escudo do Mestre.

## 9. Atualizar o site no futuro

Quando houver uma nova versão:

1. Execute `npm run build` novamente.
2. Na Netlify, abra o projeto e a seção **Deploys**.
3. Arraste a nova pasta `dist` para a área de atualização manual.

O banco e as fichas não são apagados ao atualizar o site.

## Problemas comuns

### “Conecte o banco para entrar online”

O arquivo `.env.local` não existe, tem nome incorreto ou o servidor não foi reiniciado depois da alteração.

### “Invalid API key”

Confira se você copiou a Publishable key/anon key completa e sem aspas.

### O e-mail de confirmação volta para o endereço errado

Confira a **Site URL** e as **Redirect URLs** na configuração de Authentication do Supabase.

### O código da campanha não funciona

Use exatamente os oito caracteres mostrados ao mestre. O sistema aceita letras minúsculas, mas remove espaços apenas no começo e no fim.

### A Netlify mostra página 404 ao atualizar

Confirme que você enviou a pasta `dist` gerada pela versão atual. Ela deve conter o arquivo `_redirects`.

### O painel não atualiza imediatamente

Verifique se o navegador mostra “Tempo real ativo”. Se estiver “Conectando”, confira a internet e recarregue a página.

## Publicação automática com GitHub — opcional

Se futuramente você conectar este projeto a um repositório GitHub, a Netlify detecta o Vite. O projeto já inclui `netlify.toml` com:

- comando: `npm run build`;
- pasta publicada: `dist`;
- redirecionamento de SPA.

Nesse caso, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **Project configuration → Environment variables** na Netlify antes do deploy.
