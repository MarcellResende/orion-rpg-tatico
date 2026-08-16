# Planejamento e Prompt de Implementação - Sistema Web de Fichas para RPG Tático

> **Documento destinado ao Codex / IA responsável pela implementação.**
>
> Este arquivo **não é o código do sistema**. Ele é a especificação funcional, visual e técnica que deve orientar a análise do `Manual_RPG_Tatico.pdf` e a construção da aplicação web.
>
> **Fonte de verdade das regras:** o arquivo `Manual_RPG_Tatico.pdf` fornecido junto com este planejamento.

---

# 1. Papel da IA que receber este documento

Você é responsável por **analisar o PDF do manual e implementar uma aplicação web completa de fichas automatizadas para este RPG tático**, com experiência semelhante em propósito a plataformas de ficha digital de RPG, mas com identidade própria e inteiramente adaptada às regras presentes no manual.

Sua tarefa não é apenas desenhar uma ficha HTML estática. O objetivo é construir um **sistema persistente, multiusuário, responsivo e sincronizado**, onde jogadores mantenham suas fichas e o mestre consiga acompanhar o estado de toda a equipe em tempo real.

Antes de programar regras, leia integralmente o `Manual_RPG_Tatico.pdf`.

## Regra absoluta de implementação

**Não invente, corrija, balanceie ou substitua silenciosamente nenhuma regra do manual.**

Quando uma regra estiver clara, implemente-a conforme o PDF.

Quando uma regra estiver ambígua, incompleta ou contraditória:

1. registre a inconsistência em um documento de auditoria de regras;
2. transforme a interpretação em uma configuração da campanha sempre que possível;
3. permita override manual pelo mestre;
4. nunca escolha silenciosamente uma versão como se fosse oficial.

O software deve ser capaz de evoluir junto com o RPG sem exigir reescrever toda a aplicação a cada alteração de regra.

---

# 2. Objetivo geral do produto

Criar uma plataforma web para gerenciamento de campanhas e fichas do RPG tático apresentado no manual, contendo no mínimo:

- ficha automatizada de personagem;
- inventário com peso e estados de sobrecarga;
- gerenciamento de armamentos e munição;
- atributos, perícias e sub-perícias;
- funções e habilidades;
- condições, debuffs e traumas;
- PV, Energia, Defesa, Compostura e Estresse;
- escudo/painel exclusivo do mestre;
- Ficha de Esquadrão com visão condensada de todos os operadores;
- acompanhamento de missão;
- Índice de Suspeita/Heat;
- Fases de Alerta;
- Recursos de QG e briefing pré-missão;
- veículos;
- rolagens e histórico de alterações;
- sincronização em tempo real entre mestre e jogadores;
- salvamento automático;
- sistema de permissões;
- interface temática, bonita e legível.

A experiência deve fazer o sistema parecer um **terminal operacional / centro de comando de uma unidade tática**, sem prejudicar a usabilidade.

---

# 3. Princípios de produto

## 3.1. O mestre precisa enxergar problemas em segundos

O painel do mestre deve responder imediatamente a perguntas como:

- Quem está com pouco PV?
- Quem está sem Energia?
- Quem está próximo do limite de Estresse?
- Quem perdeu Compostura?
- Quem está Sangrando, Suprimido, Atordoado ou com outro debuff?
- Quem está sobrecarregado?
- Quem está sem munição?
- Quem está em cobertura?
- Qual personagem está com PV temporário?
- Qual é o estado atual da missão?
- Qual é o Heat atual?
- Em qual Fase de Alerta estamos?
- Quantos Pontos de QG estão disponíveis?

A aplicação não pode obrigar o mestre a abrir ficha por ficha para descobrir isso.

## 3.2. A ficha do jogador deve automatizar contabilidade, não interpretação narrativa

Automatize:

- somas;
- limites;
- consumo de recursos;
- munição;
- peso;
- condições;
- modificadores matemáticos claramente definidos;
- duração de efeitos quando houver duração definida;
- alertas de regra.

Não automatize de forma rígida decisões que dependem da narrativa ou julgamento do mestre.

Exemplo: se uma regra exige que o mestre decida se uma ajuda tática faz sentido para dividir uma DT, a interface pode oferecer um botão para aplicar a divisão, mas não deve decidir automaticamente que qualquer ajuda é válida.

## 3.3. Tudo que a automação fizer deve ser compreensível

Ao passar o mouse, tocar ou abrir detalhes de um valor derivado, o usuário deve conseguir ver **como o sistema chegou naquele número**.

Exemplo de tooltip de Defesa:

```text
Defesa total: 18
Base: 10
Colete Tático Leve: +5
Meia Cobertura: +2
Postura de Ferro: +1
```

Nunca apresente apenas um valor final misterioso.

## 3.4. O mestre sempre tem a palavra final

Todo valor automatizado importante deve aceitar um **modificador manual temporário ou override do mestre**, com motivo opcional e registro no histórico.

Exemplo:

```text
Energia calculada: 20
Modificador de missão: -2
Energia máxima efetiva: 18
```

---

# 4. Identidade visual

## 4.1. Direção artística

Criar um design inspirado em:

- operações especiais;
- centro de comando;
- HUD militar;
- terminais de inteligência;
- mapas táticos;
- briefing de missão;
- equipamentos modernos.

Não copiar visualmente nenhum site existente.

O resultado deve ter identidade própria.

## 4.2. Paleta sugerida

Base:

- carvão / grafite muito escuro;
- preto azulado;
- cinza aço;
- branco quebrado para texto.

Cores funcionais:

- verde tático: estado seguro/positivo;
- ciano ou azul frio: Energia e dados técnicos;
- amarelo/âmbar: atenção;
- laranja: Estresse elevado;
- vermelho: perigo, PV crítico, condição severa ou alerta máximo;
- violeta ou âmbar suave: Compostura/estado mental.

As cores nunca podem ser a única maneira de comunicar um estado. Use também ícones, rótulos e padrões acessíveis.

## 4.3. Elementos visuais

Pode usar com moderação:

- linhas de grade;
- bordas técnicas;
- microtextos de terminal;
- pequenas coordenadas decorativas;
- barras segmentadas;
- indicadores de sinal;
- etiquetas de classificação;
- ícones militares abstratos;
- transições discretas.

Evitar:

- excesso de glitch;
- animações que dificultem leitura;
- fontes ilegíveis;
- texto minúsculo;
- neon exagerado;
- poluição visual.

## 4.4. Responsividade

### Desktop

Prioridade máxima para o Mestre e para o Escudo do Mestre.

### Tablet

Deve funcionar bem para mestre em mesa presencial.

### Celular

Prioridade para jogador consultar e editar a própria ficha rapidamente durante a sessão.

---

# 5. Perfis de usuário e permissões

Implementar pelo menos os seguintes papéis.

## 5.1. Mestre

Pode:

- criar campanha;
- editar configurações da campanha;
- convidar/remover jogadores;
- visualizar todas as fichas;
- editar todas as fichas;
- usar Escudo do Mestre;
- usar Ficha de Esquadrão;
- administrar missão;
- alterar Heat;
- alterar Fase de Alerta;
- administrar Pontos de QG;
- aplicar/remover condições;
- aplicar dano/cura/recursos;
- conceder habilidades;
- criar conteúdo customizado;
- realizar overrides;
- consultar histórico de alterações;
- bloquear determinadas partes da ficha, se necessário.

## 5.2. Jogador

Pode:

- visualizar a própria ficha;
- editar campos permitidos;
- alterar recursos atuais dentro das permissões definidas pelo mestre;
- gerenciar inventário;
- gerenciar munição;
- usar habilidades;
- realizar rolagens;
- ver informações compartilhadas do esquadrão e missão.

Não pode:

- consultar notas secretas do mestre;
- alterar ficha de outro jogador;
- alterar configurações globais da campanha;
- modificar regras da campanha.

## 5.3. Observador, opcional

Permissão somente leitura, útil para espectadores ou jogadores temporariamente sem personagem.

---

# 6. Estrutura de campanhas

O sistema deve aceitar múltiplas campanhas.

Cada campanha deve possuir:

- nome;
- descrição;
- mestre(s);
- jogadores;
- personagens;
- esquadrões;
- configurações de regra;
- conteúdo customizado;
- Pontos de QG;
- missões;
- histórico;
- data de criação;
- campanhas arquivadas.

Um personagem pertence a uma campanha e a um jogador, mas o mestre pode assumir o controle da ficha.

Preferencialmente permitir que um jogador tenha mais de um personagem na mesma campanha, mesmo que apenas um esteja ativo.

---

# 7. Ficha de personagem

A ficha deve ser modular e organizada em abas ou seções.

Sugestão de navegação:

1. **Operador**
2. **Combate**
3. **Perícias**
4. **Habilidades**
5. **Inventário**
6. **Equipamentos**
7. **Condições**
8. **Notas**

No celular, priorizar um cabeçalho fixo com recursos principais.

---

# 8. Cabeçalho da ficha

Exibir permanentemente:

- Nome;
- Vulgo/codinome;
- Idade;
- Nacionalidade;
- Traço Atribuído;
- Função;
- Remorso;
- Nível;
- retrato opcional;
- status online opcional.

Recursos principais em destaque:

- PV atual / PV máximo;
- PV temporário;
- Energia atual / Energia máxima;
- Defesa efetiva;
- Compostura atual / Compostura máxima;
- Estresse atual / limite atual;
- carga atual / limite;
- principais condições.

O manual estabelece na ficha inicial:

- Nível 1;
- PV base 20;
- Energia base 10;
- Defesa base 10;
- Estresse inicial 0/6;
- Compostura = 5 + Vontade + Inteligência.

A automação deve separar claramente:

- valor base;
- valor máximo derivado;
- valor atual;
- bônus temporário;
- penalidade temporária;
- override do mestre.

---

# 9. Atributos

A ficha apresenta:

- Força;
- Destreza;
- Inteligência;
- Constituição.

O manual relaciona os atributos a efeitos como:

- Força: impacto em carga/inventário;
- Destreza: incremento de Energia;
- Inteligência: incremento em pontos relacionados aos antecedentes;
- Constituição: incremento de PV.

Modelar os atributos separadamente da camada de efeitos.

Nunca escrever fórmulas diretamente espalhadas pelos componentes de UI. Centralizar tudo em um **motor de regras**.

Exemplo conceitual:

```text
calcularPVMáximo(character, campaignRules)
calcularEnergiaMaxima(character, campaignRules)
calcularComposturaMaxima(character, campaignRules)
calcularDefesaEfetiva(character, context, campaignRules)
```

---

# 10. Perícias, antecedentes e sub-perícias

A ficha deve representar as categorias descritas no manual.

## Combate

Sub-perícias:

- Armas de Longo Alcance;
- Armas de Médio Alcance;
- Armas de Curto Alcance;
- Armas de Artilharia;
- Corpo a Corpo.

## Comunicação

- Intimidação;
- Diplomacia;
- Negociação.

## Pilotagem

- Veículos Terrestres;
- Veículos Aquáticos;
- Veículos Aéreos.

## Tolerância

- Sobrevivência;
- Fortitude.

## Outras perícias

- Exploração;
- Furtividade;
- Medicina;
- Tecnologia;
- Vontade.

## Medicina

- Primeiros Socorros;
- Cirurgia de Guerra.

## Tecnologia

- Mecânica;
- Eletrônica;
- Reparo de Equipamentos.

## Interface de distribuição

A ficha deve mostrar:

- pontos totais;
- pontos gastos;
- pontos restantes;
- pontos provenientes de função;
- pontos provenientes de Inteligência, quando a regra for aplicável;
- pontos de sub-perícia liberados;
- validações de limite.

Quando o manual não definir claramente a proporção de distribuição de uma categoria, não inventar a proporção. Transformar a relação em configuração do sistema ou deixá-la para preenchimento manual até decisão do mestre.

---

# 11. Funções

Cadastrar as funções do manual como conteúdo de sistema:

- Infantaria;
- Médico;
- Artilharia;
- Intel;
- Franco Atirador;
- Infiltrador;
- Piloto;
- Zelador;
- Técnico de Informática.

Cada função precisa ser uma entidade configurável contendo:

- nome;
- descrição;
- bônus de atributo;
- bônus de perícia/sub-perícia;
- habilidade exclusiva;
- origem da regra no PDF;
- ativada/desativada na campanha.

Ao selecionar uma função na criação de personagem, apresentar seus bônus antes da confirmação.

O sistema deve registrar bônus de função separadamente dos pontos investidos manualmente para que seja possível reconstruir a origem de todos os valores.

---

# 12. Habilidades exclusivas por função

Cadastrar as habilidades exclusivas descritas no manual, incluindo seus custos, gatilhos e efeitos quando forem mecanicamente definidos.

Exemplos de conteúdos que devem estar representados:

- Baluarte de Linha de Frente;
- Injeção de Adrenalina de Campo;
- Supressão Avassaladora;
- Coordenador de Vanguarda;
- Tiro Cirúrgico;
- Passo Fantasma;
- Manobra no Limite;
- Armeiro de Elite;
- Ciber-Invasão Tática.

Cada habilidade precisa suportar:

- descrição;
- função relacionada;
- tipo de ação;
- custo de Energia, se houver;
- duração;
- número de usos;
- condições de ativação;
- modificadores;
- notas do mestre;
- botão de uso quando houver automação segura.

Exemplo: quando uma habilidade concede PV temporário por quantidade de rodadas definida, o software pode criar automaticamente um efeito temporário com contador de rodadas.

---

# 13. Habilidades gerais e táticas

Cadastrar as 30 habilidades gerais descritas no manual.

A estrutura não deve ser hardcoded especificamente para 30 itens. Deve ser possível adicionar novas habilidades posteriormente.

Cada habilidade deve suportar diferentes formatos de efeito:

- bônus passivo;
- alteração de custo de ação;
- alteração de atributo derivado;
- modificador de perícia;
- modificador de dano;
- resistência;
- imunidade;
- melhoria de cobertura;
- uso limitado por combate;
- reação;
- efeito contextual;
- apenas texto quando não for seguro automatizar.

Habilidades com efeitos contextuais não precisam ser completamente automatizadas. É preferível mostrar um lembrete correto a implementar uma automação incorreta.

---

# 14. PV e ferimentos

Separar:

- PV base;
- PV máximo;
- PV atual;
- PV temporário;
- proteção/equipamento;
- traumas;
- condições.

## Ações rápidas

Na ficha e no Escudo do Mestre:

- `-1`, `-5`, campo de dano customizado;
- cura;
- adicionar/remover PV temporário;
- restaurar ao máximo;
- desfazer última alteração.

Mudanças devem gerar histórico.

## Estados visuais sugeridos

- acima de 50%: normal;
- até 50%: atenção;
- muito baixo: crítico;
- 0 ou abaixo: estado crítico personalizado pelo mestre.

Não inventar regras de morte se o manual não as definir.

---

# 15. Energia

Energia deve possuir:

- base;
- máxima;
- atual;
- bônus temporário;
- penalidades;
- custos aumentados por condições;
- regeneração temporária quando uma regra explicitamente conceder.

Toda habilidade que consome Energia deve poder perguntar se o jogador deseja aplicar o custo automaticamente.

Não permitir Energia negativa por padrão, porém oferecer override do mestre.

---

# 16. Compostura

Tratar Compostura como recurso com:

- máximo;
- atual.

Fórmula apresentada no manual:

```text
Compostura máxima = 5 + Vontade + Inteligência
```

O Duelo Social utiliza Compostura como uma espécie de resistência mental.

O sistema deve permitir:

- reduzir Compostura;
- restaurar Compostura;
- indicar quando chega a 0;
- registrar a origem da alteração;
- aplicar efeitos de habilidades que restauram Compostura quando o texto do manual permitir.

Não concluir automaticamente o resultado narrativo de uma ruptura. Apenas sinalizar ao mestre:

```text
COMPOSTURA ESGOTADA - verificar Regra de Ruptura.
```

---

# 17. Estresse

Estresse merece um componente próprio e muito visível.

Estado padrão do manual:

```text
0 / 6
```

O sistema precisa suportar mudanças temporárias no limite, como efeitos de grupo que podem elevar o limite.

Exibir barra segmentada em vez de barra percentual comum, pois o número de pontos é pequeno e significativo.

Exemplo:

```text
[●][●][●][○][○][○]
3 / 6
```

Ao alcançar o limite efetivo, mostrar alerta sobre Visão de Túnel/Pânico Tático, respeitando imunidades e habilidades aplicáveis.

## Queimar Adrenalina

Quando aplicável, disponibilizar ação que:

1. avisa o jogador do custo;
2. adiciona +2 Estresse;
3. registra que a ação foi usada para rerrolar d20;
4. abre ou executa a rerrolagem somente se o sistema de dados estiver habilitado.

---

# 18. Condições, debuffs e traumas

Criar sistema genérico de condições.

Condições presentes no manual incluem, entre outras:

- Atordoado;
- Cego/Ofuscado;
- Suprimido;
- Sangrando;
- Desorientado;
- Visão de Túnel;
- Imobilizado/Ancorado;
- Exausto/Fadiga Tática;
- Fadiga Leve;
- Inspirado;
- Inanição;
- traumas localizados em braço/perna/concussão.

Cada condição deve ter:

- nome;
- categoria;
- descrição;
- origem;
- modificadores;
- duração opcional;
- contador de rodadas opcional;
- removível automaticamente ou manualmente;
- visibilidade para jogador/mestre;
- referência no manual.

## Condições temporizadas

Quando uma duração for definida em rodadas, usar contador.

O mestre deve poder avançar a rodada globalmente e o sistema atualizar condições temporizadas.

Nunca remover silenciosamente uma condição narrativa cuja regra dependa de teste ou tratamento. Nesse caso, apenas avisar que o tempo passou e solicitar confirmação.

---

# 19. Defesa, cobertura e postura

Separar Defesa em camadas:

```text
Defesa base
+ equipamento
+ habilidade
+ cobertura
+ postura
+ efeitos temporários
+ override
= Defesa efetiva
```

A interface deve mostrar também uma **Defesa sem contexto**, útil fora de combate, e uma **Defesa efetiva atual**, baseada em cobertura/postura/efeitos.

Estados possíveis de postura:

- Em pé;
- Ajoelhado;
- Deitado.

Estados de cobertura:

- Sem cobertura;
- Meia Cobertura;
- Cobertura Total;
- cobertura customizada.

Coberturas específicas de veículos podem fornecer valores próprios e não devem ser forçadas a usar o valor padrão.

## Desgaste da cobertura

A regra descreve que fogo pesado pode destruir cobertura, mas não define necessariamente PV exatos para toda cobertura.

Portanto implementar uma ferramenta de mestre com estados:

- Íntegra;
- Danificada;
- Destruída;

Opcionalmente permitir PV customizado para cobertura, mas não inventar PV padrão.

---

# 20. Ações e economia de turno

O sistema deve conhecer tipos de ação como conceitos, sem presumir regras inexistentes.

Possíveis categorias a representar:

- Ação Principal/Padrão;
- Ação Secundária;
- Ação Bônus;
- Ação de Movimento;
- Ação Livre;
- Reação;
- Meia Ação.

## Meia Ação

Criar contador por turno:

```text
Meias Ações: 0 / 2
```

Cada Meia Ação normalmente deve conseguir aplicar custo de deslocamento conforme a configuração da campanha.

Exemplos de atalho:

- Alternar modo de disparo;
- Ativar/desativar acessório;
- Sinalização tática;
- Largar equipamento;
- Ajustar coronha/bipé.

O software deve permitir desabilitar o bloqueio automático de Meia Ação em determinados estados, pois há uma inconsistência de texto no manual descrita na seção de auditoria deste documento.

---

# 21. Armamentos e munição

Este deve ser um dos módulos mais automatizados do sistema.

Cada arma deve possuir, quando aplicável:

- nome;
- categoria;
- peso;
- dano;
- capacidade do carregador;
- munição atual;
- modos de disparo suportados;
- requisitos;
- alcance/categoria de sub-perícia;
- modificadores;
- acessórios;
- observações;
- origem no manual.

## 21.1. Munição deve ser modelada por carregador, não apenas como número total

Isso é importante por causa das regras de Recarga Tática e Recarga Rápida.

Estrutura conceitual de carregador:

```text
Magazine
- id
- tipo de munição
- capacidade
- munição atual
- estado: carregado | inventário | descartado | perdido
- arma compatível
```

### Recarga Tática

Fluxo desejado:

1. usuário escolhe um carregador novo;
2. carregador atual é removido;
3. se ainda possuir munição, retorna ao inventário;
4. novo carregador é inserido;
5. custo de ação é registrado conforme configuração da campanha.

### Recarga Rápida de Emergência

Fluxo desejado:

1. carregador atual é removido;
2. carregador passa para estado `descartado`;
3. munição restante deixa de estar disponível imediatamente;
4. novo carregador é inserido;
5. sistema registra a ação.

O mestre pode permitir recuperar carregadores descartados posteriormente.

## 21.2. Modos de disparo

Representar pelo menos:

- Semiautomático;
- Rajada Curta;
- Automático.

A interface deve impedir selecionar um modo que a arma não suporta segundo o manual.

Ao disparar:

- reduzir automaticamente a munição correspondente;
- mostrar os modificadores do modo;
- nunca permitir consumo maior que a munição atual sem confirmação do mestre;
- registrar o disparo no log opcional.

Para Automático, permitir selecionar a quantidade de tiros dentro do intervalo definido pela regra aplicável.

## 21.3. Estado de arma

Preparar arquitetura para:

- travada;
- revisada;
- danificada;
- descarregada;
- segurança/modo de tiro;
- bônus de primeiro carregador;
- modificadores de manutenção.

Mesmo que nem todos esses estados sejam usados no MVP, o modelo deve comportá-los.

---

# 22. Inventário e carga

O inventário deve ser visual, rápido e automático.

Cada item precisa ter:

- nome;
- quantidade;
- peso unitário;
- peso total;
- categoria;
- usos/cargas;
- equipado ou guardado;
- consumível/reutilizável;
- observações;
- origem no manual.

Exibir no topo:

```text
Carga atual: 18,2 kg
Limite sem penalidade: 20 kg
Estado: Normal
```

Quando ultrapassar limites, mostrar imediatamente:

- nível de sobrecarga;
- penalidades atualmente aplicáveis.

## Importante

Existe potencial conflito entre a ficha inicial, que relaciona Força a inventário, e a seção posterior de Limite de Carga Base, que relaciona a capacidade à Tolerância.

Não resolver isso sozinho.

Implementar regra de campanha configurável, por exemplo:

```text
Método de carga:
( ) Tabela por Tolerância
( ) Base + Força
( ) Fórmula customizada
```

O mestre escolhe a interpretação oficial da campanha.

---

# 23. Catálogo de equipamentos

Transformar os itens do PDF em catálogo estruturado.

Categorias do manual:

- Armamento Primário;
- Armamento Secundário e Acessórios;
- Reconhecimento e Invasão;
- Guerra Eletrônica e Suporte;
- Explosivos e Granadas;
- Sobrevivência e Suprimentos;
- Proteção e Vestuário;
- Distração e entretenimento;
- Culinária;
- Abrigo & Proteção Ambiental;
- Ferramentas & Mobilidade.

## Fluxo

O jogador ou mestre clica em `Adicionar equipamento`, pesquisa o catálogo e adiciona uma instância à ficha.

A instância pode divergir do template.

Exemplo:

```text
Template: Pistola Tática
Instância de João:
- munição atual 6/10
- acessório X
- nota personalizada
```

O mestre precisa conseguir criar itens customizados.

---

# 24. Proteção e vestuário

Equipamentos defensivos devem contribuir para a Defesa quando a regra do item disser isso.

Mostrar:

- peça equipada;
- bônus;
- requisitos;
- penalidades;
- peso;
- efeitos especiais.

Não somar automaticamente itens que não podem ser usados simultaneamente se o mestre configurar slots incompatíveis.

Criar conceito de slots opcional:

- corpo;
- cabeça;
- escudo/mão;
- acessório.

---

# 25. Rolagens de dados

Implementar rolagem integrada, mas de maneira que não dependa dela para a ficha funcionar.

Suportar:

- d20;
- d4;
- d6;
- d8;
- d10;
- d12;
- combinações como 2d8, 2d12, 4d6;
- modificadores;
- rerrolagem.

## Testes

Como a fórmula universal de todo teste não está integralmente definida no manual, criar um construtor transparente:

```text
1d20
+ atributo selecionado
+ perícia
+ sub-perícia
+ bônus de item
+ modificadores temporários
```

O jogador pode confirmar os componentes antes da rolagem.

Se determinada regra da campanha definir uma fórmula padrão, permitir configurar presets.

## Registro

Log de rolagens da sessão:

- personagem;
- horário;
- fórmula;
- resultado;
- contexto opcional;
- rerrolagem;
- resultado anterior.

O mestre pode escolher se as rolagens são públicas, privadas ou secretas.

---

# 26. Dificuldade por Ambiente

Criar widget rápido do mestre para consultar e selecionar o nível de ambiente.

Categorias do manual:

- Ambiente Tranquilo;
- Ambiente de Tensão;
- Combate Ativo sob Fogo de Supressão;
- Ambiente Extremo.

Mostrar a faixa de DT correspondente conforme o manual.

No Escudo do Mestre, exibir um seletor:

```text
AMBIENTE ATUAL
[ Tensão ▼ ]
DT sugerida pelo manual: 6-10
```

A palavra **sugerida** ou equivalente deve ser usada se a DT final continuar sendo decisão do mestre.

---

# 27. Regra "A União Faz a Força"

Criar ferramenta opcional para o mestre.

Fluxo:

1. mestre informa DT original;
2. seleciona dois operadores;
3. confirma que a narrativa permite ajuda;
4. sistema calcula a divisão usando o arredondamento indicado pelo manual;
5. exibe o valor-alvo para cada participante.

Não aplicar automaticamente apenas porque dois jogadores participaram.

---

# 28. Investigação e espionagem

Criar painel de missão com módulo de investigação.

## 28.1. Duelo Social

Exibir:

- alvo;
- Compostura máxima;
- Compostura atual;
- DT;
- tipo de ataque social;
- histórico de dano de Compostura;
- estado de ruptura.

Tipos descritos:

- Lógica;
- Intimidação;
- Manipulação.

Não inventar atributos ou fórmulas adicionais não definidos.

## 28.2. Recon / Pistas

Criar quadro de investigação com pistas.

Cada pista:

- título;
- descrição;
- categoria;
- obtida por;
- operador responsável;
- data/sessão;
- pública ou secreta;
- anexo opcional;
- relacionada a NPC/local/alvo.

Categorias explicitamente presentes no PDF devem ser cadastradas.

O texto fala em três categorias, mas o manual compilado pode não explicitar todas elas. Não inventar a terceira categoria: registrar a lacuna e permitir ao mestre adicionar categorias customizadas.

---

# 29. Índice de Suspeita / Heat

Criar tracker muito visível com escala de 0 a 5.

Estados:

- 0 - Invisível;
- 1 - Curiosidade;
- 2 - Observação;
- 3 - Alerta;
- 4 - Hostilidade;
- 5 - Queimado.

Exibir como barra segmentada, com texto do efeito de cada nível.

O mestre deve poder alterar com um clique.

Como o manual não torna totalmente inequívoco se Heat é sempre global, individual ou pode variar por operador, modelar o sistema de modo flexível:

- tracker global da missão por padrão;
- possibilidade de tracker individual opcional na configuração da campanha.

---

# 30. Fases de Alerta

Manter este sistema separado de Heat.

Estados:

- Verde - Desprevenido;
- Amarelo - Suspeito;
- Vermelho - Combate/Caçada.

No painel do mestre:

```text
ALERTA: AMARELO - SUSPEITO
```

Ao mudar para Combate/Caçada, o sistema pode oferecer:

```text
Rolar 1d4 para chegada de reforços?
```

Se confirmado:

- realizar rolagem;
- criar contador de rodadas;
- exibir `Reforços em X rodadas`;
- diminuir a cada avanço de rodada.

Não criar inimigos automaticamente, porque quantidade e natureza dos reforços são decisão do mestre.

---

# 31. Briefing e Pontos de QG

Criar módulo `Briefing` por missão.

## Saldo de QG

Exibir:

```text
Recursos de QG: 8 pontos
```

O sistema deve permitir:

- adicionar pontos por sessão;
- gastar pontos;
- devolver pontos;
- registrar transações;
- justificar alterações;
- bloquear saldo negativo, salvo override.

Itens de briefing do manual devem existir como opções com seus custos.

Exemplo de fluxo:

```text
[Comprar] Mapa Estrutural do Alvo - 2 QG
Saldo: 8 -> 6
```

Como o manual diz que o QG fornece pontos por sessão, mas não define com clareza todas as regras de expiração/acúmulo, o software deve manter saldo persistente e permitir ao mestre configurar reset ou acúmulo.

---

# 32. Missões

Criar entidade `Mission`.

Campos sugeridos:

- nome;
- status: planejamento / ativa / concluída / arquivada;
- objetivo;
- local;
- briefing;
- notas do mestre;
- notas públicas;
- Heat;
- Fase de Alerta;
- Ambiente/DT;
- Pontos de QG gastos;
- benefícios de briefing ativos;
- contador de rodada;
- reforços;
- veículos vinculados;
- personagens participantes;
- condições globais;
- log da missão.

---

# 33. Rodadas e combate

Criar um módulo simples de combate sem tentar virar um VTT completo.

Necessário:

- contador de rodada;
- botão `Próxima rodada`;
- lista opcional de iniciativa manual;
- condições temporizadas;
- contadores de habilidade;
- reforços;
- registro de eventos.

Não inventar fórmula de iniciativa se não estiver definida.

O mestre pode inserir a ordem manualmente ou usar rolagem customizada.

---

# 34. Ação "Aguardar Ângulo"

Criar estado/ação tática que um jogador possa ativar.

Na ficha:

```text
[ Ativar Aguardar Ângulo ]
```

Ao ativar:

- marcar personagem como `Cobrindo ângulo`;
- permitir descrição do ponto coberto;
- exibir badge no Escudo do Mestre;
- consumir a ação apropriada somente conforme regra/configuração;
- remover após disparo/reação ou quando mestre encerrar.

Não decidir automaticamente se um inimigo entrou no ângulo; o mestre confirma o gatilho.

---

# 35. Descanso, moral, alimentação e estresse

Criar módulo de descanso que reúna as regras do manual.

Tipos:

- Descanso Curto;
- Descanso Longo.

Atividades recreativas cadastradas conforme PDF.

Cada atividade deve mostrar:

- tempo;
- requisitos;
- custo;
- efeito;
- risco;
- botão de aplicar.

Ao aplicar uma atividade:

1. verificar se itens/requisitos estão presentes quando isso for seguramente verificável;
2. pedir confirmação;
3. consumir item se necessário;
4. alterar Estresse/recursos;
5. aplicar condição secundária;
6. registrar no histórico.

## Alimentação

Registrar:

- MRE/mantimentos;
- comida típica;
- prato favorito;
- outros criados pelo mestre.

O prato favorito deve ser campo configurável do personagem se a campanha utilizar essa regra.

## Espírito de Corpo

Quando os requisitos da sinergia estiverem marcados como cumpridos, oferecer ao mestre um botão para ativar o efeito de grupo.

Nunca inferir sozinho que todos comeram/socializaram apenas por possuírem os itens.

---

# 36. Veículos

Criar módulo de veículos com templates baseados no manual.

Categorias:

- terrestres militares;
- terrestres leves;
- aéreos;
- aquáticos.

Cada veículo deve possuir quando aplicável:

- nome;
- tipo;
- Blindagem/RD;
- PV do Motor atual/máximo;
- PV do Chassi atual/máximo;
- velocidade máxima;
- capacidade;
- tripulação;
- passageiros;
- armamentos;
- efeitos especiais;
- notas;
- imagem opcional;
- origem no manual.

## Instância de veículo

Assim como itens, separar template e instância.

Exemplo:

```text
Template: MRAP
Instância: MRAP "Anvil-2"
Motor: 48/70
Chassi: 112/130
Tripulação atual: 5
```

No Escudo do Mestre, veículos ativos podem aparecer em uma seção própria.

---

# 37. Escudo do Mestre - requisito central

Esta é uma das telas mais importantes do sistema.

Criar uma interface densa, legível e otimizada para desktop/tablet.

## 37.1. Cabeçalho global

Mostrar:

- nome da campanha;
- missão ativa;
- rodada;
- Ambiente/DT;
- Heat;
- Fase de Alerta;
- Reforços em X rodadas;
- QG disponível;
- número de jogadores conectados.

## 37.2. Cards/linhas de operadores

Cada personagem deve exibir sem precisar abrir modal:

- retrato pequeno ou iniciais;
- Nome/Vulgo;
- Função;
- PV atual/máximo;
- PV temporário;
- Energia atual/máxima;
- Compostura atual/máxima;
- Estresse atual/limite;
- Defesa efetiva;
- carga/sobrecarga;
- munição da arma principal;
- postura;
- cobertura;
- principais condições;
- status de conexão.

## 37.3. Barras compactas

Sugestão visual:

```text
RAVEN | Infiltrador
PV   ███████░░ 14/20
EN   █████░░░░  6/10
CP   ██████░░░  8/12
STR  ●●●●○○    4/6
[SUPRIMIDO] [MEIA COBERTURA]
```

## 37.4. Ações rápidas do mestre

Ao lado de cada operador:

- aplicar dano;
- curar;
- Energia +/-;
- Compostura +/-;
- Estresse +/-;
- adicionar condição;
- remover condição;
- abrir ficha;
- adicionar nota rápida;
- aplicar override.

Evitar exigir muitos cliques.

## 37.5. Ordenação e filtros

Permitir:

- ordem manual;
- por função;
- por PV;
- por Estresse;
- por nome;
- apenas personagens com condição;
- apenas críticos.

Criar botão `Modo Crítico` que destaca apenas quem exige atenção.

## 37.6. Atualização em tempo real

Se um jogador gastar Energia em seu celular, o mestre deve ver a mudança em poucos instantes sem atualizar a página.

A mesma regra vale para:

- PV;
- Compostura;
- Estresse;
- munição;
- inventário;
- condições;
- habilidades;
- conexão.

---

# 38. Ficha de Esquadrão

Criar uma tela separada chamada **Ficha de Esquadrão**.

Ela é uma visão ainda mais condensada que o Escudo do Mestre e deve poder ser consultada rapidamente ou deixada aberta em um segundo monitor.

## 38.1. Tabela principal

Sugestão:

| Operador | Função | PV | EN | CP | Estresse | Defesa | Carga | Arma/Munição | Condições |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| Raven | Infiltrador | 14/20 | 6/10 | 8/12 | 4/6 | 17 | 17/20kg | SMG 12/25 | Suprimido |
| Vance | Médico | 20/20 | 8/15 | 11/11 | 1/6 | 15 | 14/20kg | Fuzil 18/20 | - |

A tabela deve usar mini-barras e badges, não apenas números.

## 38.2. Resumo do grupo

Acima da tabela:

- operadores ativos;
- operadores em estado crítico;
- quantidade Sangrando;
- Estresse médio;
- munição crítica;
- sobrecarga;
- Heat;
- Alerta;
- QG;
- veículo ativo.

Não transformar métricas de grupo em regras se elas forem apenas informativas.

## 38.3. Modos

### Modo Operação

Prioriza:

- PV;
- Energia;
- Compostura;
- Estresse;
- Defesa;
- condições;
- munição.

### Modo Logística

Prioriza:

- peso;
- munição reserva;
- equipamentos especiais;
- kits médicos;
- explosivos;
- comunicação;
- veículo.

### Modo Briefing

Prioriza:

- função;
- perícias relevantes;
- equipamento;
- bônus de planejamento;
- Recursos de QG;
- benefícios comprados.

## 38.4. Impressão/exportação

Opcional, mas recomendado:

- modo de impressão limpo;
- exportar resumo para PDF;
- exportar estado do esquadrão em JSON/CSV.

---

# 39. Painel do jogador

Criar uma Home do jogador com menos complexidade que o Escudo do Mestre.

Mostrar:

- personagem ativo;
- recursos atuais;
- missão atual;
- condições;
- arma atual;
- munição;
- atalhos para habilidades;
- inventário rápido;
- últimas rolagens;
- alertas do mestre.

No celular, botões principais devem ser grandes o suficiente para uso durante a sessão.

---

# 40. Sistema de modificadores

Não codificar dezenas de casos especiais diretamente em componentes.

Criar motor de modificadores genérico.

Estrutura conceitual:

```text
Modifier
- sourceType
- sourceId
- target
- operation: add | subtract | set | multiply | ignore | immunity
- value
- condition
- priority
- duration
- stackPolicy
```

Exemplos de `target`:

- max_hp;
- max_energy;
- defense;
- skill.combate;
- subskill.long_range;
- movement;
- energy_cost;
- stress_limit;
- damage.firearm;
- cover_bonus;

Isso permitirá adicionar habilidades futuras sem reescrever toda a ficha.

---

# 41. Valores base, derivados, atuais e temporários

Adotar convenção de dados clara.

## Base

Valor natural/estrutural.

## Derivado

Calculado a partir das regras.

## Atual

Recurso consumível atual.

## Temporário

Bônus ou penalidade com duração/contexto.

## Override

Alteração manual autorizada.

Exemplo:

```text
PV:
base = 20
constitutionBonus = 20
generalAbilityBonus = 5
maxCalculated = 45
overrideMax = null
current = 32
temporary = 5
```

Não armazenar valores derivados redundantes se puderem ser recalculados com segurança. Quando forem armazenados por performance, definir estratégia clara de invalidação/recalculo.

---

# 42. Motor de regras configurável

Criar uma camada central de configuração por campanha.

Exemplos:

```text
stress.defaultMax = 6
stress.spiritOfCorpsMax = 7
base.hp = 20
base.energy = 10
base.defense = 10
composture.formula = "5 + vontade + inteligencia"
load.method = "tolerance_table"
halfAction.maxPerTurn = 2
halfAction.movementCost = 3
```

Configurações oficiais devem vir preenchidas com valores do manual, mas o mestre pode alterar regras caseiras sem editar código.

Alterações de regra devem ter:

- nome;
- valor anterior;
- novo valor;
- data;
- responsável.

---

# 43. Conteúdo customizado

O mestre deve poder criar:

- função;
- habilidade;
- item;
- arma;
- armadura;
- condição;
- veículo;
- traço;
- categoria de pista;
- regra textual;
- preset de teste.

O conteúdo oficial derivado do PDF deve ser marcado como:

```text
[MANUAL]
```

Conteúdo criado pelo mestre:

```text
[HOME BREW]
```

Não impedir edição, mas oferecer duplicação para que o mestre não precise alterar o template oficial diretamente.

---

# 44. Histórico e auditoria

Registrar alterações importantes.

Exemplos:

```text
20:42 - Raven gastou 3 Energia. 9 -> 6
20:43 - Mestre aplicou Suprimido em Raven.
20:44 - Raven disparou rajada: SMG 25 -> 22.
20:45 - Mestre aumentou Heat: 2 -> 3.
20:47 - Vance curou Raven: 11 -> 16 PV.
```

O log deve registrar:

- timestamp;
- usuário;
- entidade;
- valor anterior;
- valor novo;
- motivo/contexto;
- origem: manual / usuário / automação / mestre.

Implementar `desfazer` para ações recentes quando tecnicamente seguro.

---

# 45. Persistência e sincronização

Requisitos:

- salvamento automático;
- banco persistente;
- atualizações em tempo real;
- controle de concorrência;
- operações atômicas para recursos;
- proteção contra duplicação de clique;
- recuperação após perda de conexão;
- feedback visual de `salvando`, `salvo`, `offline`.

Exemplo importante:

Se jogador e mestre alterarem Estresse quase ao mesmo tempo, o sistema não deve sobrescrever cegamente uma das alterações.

Usar operações incrementais ou transações quando possível.

---

# 46. Arquitetura técnica sugerida

A implementação final deve rodar como aplicação web moderna produzindo HTML/CSS/JavaScript para o navegador.

## Stack de referência

Uma opção adequada seria:

- **Front-end:** React + TypeScript;
- **Framework web:** Next.js ou equivalente;
- **Estilo:** CSS Modules, Tailwind ou sistema de design próprio;
- **Back-end:** API server-side do próprio framework ou Node.js;
- **Banco:** PostgreSQL;
- **Autenticação:** solução segura com sessão/token;
- **Tempo real:** WebSocket, Supabase Realtime ou tecnologia equivalente;
- **Validação:** schemas compartilhados client/server;
- **Testes:** unitários + integração + E2E.

O Codex pode escolher outra stack se o ambiente de execução justificar, mas deve manter:

- tipagem quando possível;
- separação de domínio;
- componentes reutilizáveis;
- banco relacional ou estrutura igualmente robusta;
- sincronização em tempo real;
- migrations;
- testes.

Evitar construir todo o projeto como um único `index.html` gigante ou um único arquivo JavaScript.

---

# 47. Organização de projeto sugerida

Estrutura conceitual:

```text
src/
  app/
  components/
    ui/
    status/
    character/
    gm/
  features/
    auth/
    campaigns/
    characters/
    squad/
    missions/
    combat/
    inventory/
    equipment/
    abilities/
    conditions/
    vehicles/
    dice/
  rules/
    engine/
    definitions/
    calculations/
    validators/
  db/
    schema/
    migrations/
    seeds/
  services/
    realtime/
    audit/
  types/
  tests/
```

A pasta `rules/` é crítica.

Componentes visuais não devem conter lógica de regra duplicada.

---

# 48. Modelo de dados recomendado

Criar entidades equivalentes a:

```text
User
Campaign
CampaignMember
Character
CharacterAttribute
CharacterSkill
CharacterSubskill
TraitDefinition
CharacterTrait
FunctionDefinition
AbilityDefinition
CharacterAbility
ItemDefinition
ItemInstance
WeaponDefinition
WeaponInstance
MagazineInstance
ArmorDefinition
ConditionDefinition
CharacterCondition
VehicleDefinition
VehicleInstance
Squad
SquadMember
Mission
MissionParticipant
MissionState
BriefingOption
BriefingPurchase
HQTransaction
InvestigationClue
DiceRoll
RuleConfig
ManualRuleReference
Override
AuditEvent
```

Não é obrigatório usar exatamente esses nomes, mas o modelo deve separar:

- templates de conteúdo;
- instâncias de personagem;
- estado atual;
- regras/configuração;
- histórico.

---

# 49. Referência ao manual dentro dos dados

Todo conteúdo transcrito do PDF deve guardar metadados de origem, quando possível:

```text
sourceDocument: "Manual_RPG_Tatico.pdf"
sourcePage: 16
sourceSection: "Debuffs Físicos e de Combate"
```

Isso permitirá mostrar no sistema:

```text
Ver regra no manual - página 16
```

Não é necessário fazer parsing do PDF em runtime.

O PDF serve como fonte para gerar dados iniciais/seeds auditáveis.

---

# 50. Mapa aproximado do PDF para implementação

Use este mapa apenas para navegação. Sempre leia o conteúdo integral.

- páginas 3-4: ficha e recursos iniciais;
- páginas 4-5: recarga, briefing, Aguardar Ângulo, Meia Ação;
- páginas 5-6: investigação, Compostura, Heat;
- páginas 6-9: habilidades e funções;
- páginas 9-12: veículos e dificuldade por ambiente;
- páginas 12-13: dificuldade e União Faz a Força;
- páginas 13-14: sub-perícias, cobertura, Estresse, traumas;
- páginas 14-16: modos de disparo, carga e sobrecarga;
- páginas 16-18: debuffs, traços, descanso e moral;
- páginas 19-22: alerta, armas, equipamentos, suprimentos e ferramentas.

---

# 51. Auditoria obrigatória de ambiguidades do manual

Antes de finalizar a automação, o Codex deve criar um arquivo, por exemplo:

```text
docs/rule-audit.md
```

Ele deve listar todos os pontos ambíguos encontrados.

Já existem pelo menos os seguintes pontos que precisam de atenção:

## 51.1. Carga: Força vs. Tolerância

A ficha inicial relaciona Força a aumento de inventário, enquanto a regra posterior de Limite de Carga Base afirma que o limite varia segundo Tolerância e apresenta tabela própria.

**Solução de software:** regra configurável; não escolher silenciosamente.

## 51.2. Imobilizado e Meia Ação

A regra de Meia Ação informa que um operador Imobilizado não pode realizar Meias Ações que exijam compensação de movimento.

A seção posterior de Imobilizado/Ancorado afirma que o operador ainda pode atirar e usar Meias Ações.

**Solução:** configuração da campanha ou confirmação do mestre.

## 51.3. Franco Atirador e classificação de rifle de precisão

A função Franco Atirador menciona bônus em uma classificação de arma que pode não coincidir diretamente com a organização de sub-perícias descrita posteriormente.

**Solução:** não reclassificar por conta própria; permitir configuração do bônus e registrar a inconsistência.

## 51.4. Firmeza no Gatilho vs. penalidades do Automático

Uma habilidade menciona redução de uma penalidade genérica do Automático, enquanto a descrição detalhada do modo Automático utiliza penalidades progressivas por disparo.

**Solução:** criar regra configurável de aplicação e não presumir uma matemática não especificada.

## 51.5. Custo da Recarga Tática

O texto utiliza uma indicação de ação com barra, que pode ser interpretada de mais de uma forma.

**Solução:** armazenar o custo como configuração da campanha.

## 51.6. Perfeccionista e "custo de recarga"

A vantagem fala em reduzir o custo da primeira recarga, mas o custo de recarga é descrito em ações e não em valor numérico universal.

**Solução:** lembrete manual ou configuração específica.

## 51.7. HUMINT/SIGINT e terceira categoria

A investigação menciona três categorias de peças, mas a compilação pode não apresentar de forma explícita as três categorias.

**Solução:** cadastrar apenas as explicitamente definidas e permitir categoria customizada.

## 51.8. Sociabilidade

Uma atividade de descanso menciona teste de Sociabilidade, mas a ficha não apresenta claramente uma perícia com esse nome.

**Solução:** não mapear automaticamente para Diplomacia/Comunicação sem decisão do mestre.

## 51.9. Sanidade

Algumas regras restauram Sanidade, mas a ficha-base não define claramente uma barra inicial de Sanidade.

**Solução:** implementar Sanidade como módulo/campo opcional e desativado por padrão até configuração do mestre, ou solicitar decisão durante setup da campanha.

## 51.10. Movimento base

Há penalidades expressas em metros, porém o valor de deslocamento base do operador não está totalmente especificado na ficha compilada.

**Solução:** campo configurável da campanha/personagem.

## 51.11. Iniciativa

Existem bônus de iniciativa, mas não há necessidade de presumir uma fórmula universal de iniciativa se ela não estiver definida.

**Solução:** valor/rolagem configurável.

## 51.12. Limite de Estresse aumentado

Há efeito que expande o limite de 6 para 7. O software deve permitir definir se o gatilho negativo acompanha o novo limite, sem assumir stacking de efeitos não descrito.

## 51.13. Heat global ou individual

A redação não precisa ser tratada como prova de que o tracker é exclusivamente individual ou exclusivamente global.

**Solução:** suporte estrutural aos dois; padrão definido pelo mestre.

## 51.14. QG: acúmulo ou reset

O manual define ganho por sessão e custos, mas o ciclo de reset/acúmulo pode exigir interpretação.

**Solução:** ledger persistente e opção de reset configurável.

A IA deve procurar outras inconsistências além destas.

---

# 52. Setup inicial da campanha

Ao criar campanha, apresentar um wizard.

## Etapa 1 - Informações

- nome;
- mestre;
- descrição.

## Etapa 2 - Regras ambíguas

Perguntar apenas decisões relevantes, com textos claros.

Exemplo:

```text
Como calcular o limite de carga?
○ Tabela de Tolerância
○ Bônus por Força
○ Personalizado
```

## Etapa 3 - Recursos opcionais

- Sanidade;
- Heat individual;
- rolagem integrada;
- iniciativa;
- slots de equipamento;
- regras customizadas.

## Etapa 4 - Criar/Convidar Esquadrão

- nome do esquadrão;
- código/link de convite.

---

# 53. Criação de personagem

Criar wizard para evitar uma ficha enorme logo de início.

Sugestão:

1. Identidade;
2. Função;
3. Atributos;
4. Perícias;
5. Sub-perícias;
6. Traço;
7. Habilidades iniciais, se aplicável;
8. Equipamentos;
9. Prato favorito e campos narrativos opcionais;
10. Revisão final.

Sempre mostrar resumo de pontos restantes.

Não permitir ficha inválida quando o manual claramente define um limite, exceto se o mestre ativar `Permitir ficha fora das regras`.

---

# 54. Traços

Cadastrar os traços do manual como templates.

Cada traço deve conter:

- nome;
- perfil;
- vantagem;
- gatilho de roleplay;
- automações possíveis;
- efeitos não automatizáveis como lembrete.

Não automatizar comportamentos de roleplay.

O sistema pode lembrar o jogador do gatilho, mas nunca obrigar uma ação narrativa.

---

# 55. Alertas inteligentes de ficha

Criar alertas úteis, sem virar uma avalanche de popups.

Exemplos:

- `PV abaixo de 50%`;
- `Estresse no limite`;
- `Sangrando: perda recorrente de PV segundo o manual`;
- `Sobrecarga Severa`;
- `Arma sem munição`;
- `Nenhum carregador cheio disponível`;
- `Energia insuficiente para habilidade`;
- `Condição impede ação complexa`;
- `Reforços chegam nesta rodada`;
- `QG insuficiente para compra`.

Alertas devem oferecer explicação e não apenas bloquear ações.

O mestre pode forçar uma ação mesmo quando a regra normalmente impediria, deixando log de override.

---

# 56. Segurança e privacidade

Implementar:

- autenticação segura;
- autorização no servidor, não apenas esconder botão no front-end;
- isolamento entre campanhas;
- jogadores não podem consultar dados secretos por manipulação de URL/API;
- proteção CSRF/XSS/SQL injection conforme stack;
- validação de inputs;
- rate limits onde fizer sentido;
- senhas nunca armazenadas em texto puro;
- secrets fora do repositório;
- regras de acesso no banco.

Se usar Supabase, aplicar RLS corretamente.

---

# 57. Acessibilidade

Obrigatório:

- contraste adequado;
- navegação por teclado;
- labels em inputs;
- foco visível;
- ARIA quando necessário;
- não depender somente de cor;
- layout funcional com zoom;
- barras com valor textual.

Tema militar não justifica sacrificar acessibilidade.

---

# 58. Performance

O Escudo do Mestre pode exibir vários personagens e receber alterações em tempo real.

Evitar re-renderizações desnecessárias.

Requisitos:

- atualizações granulares;
- cache adequado;
- paginação para logs grandes;
- lazy load de telas secundárias;
- imagens otimizadas;
- banco indexado por campanha/personagem/missão.

---

# 59. Modo offline/PWA - desejável

Se viável, transformar em PWA.

No mínimo:

- página instalada no celular;
- cache da interface;
- aviso de offline;
- fila de alterações simples com reconciliação ao reconectar.

Nunca simular que uma alteração foi sincronizada quando não foi.

---

# 60. Exportação e backup

Implementar exportação de campanha em formato estruturado.

Preferência:

```text
campaign-backup.json
```

Também desejável:

- ficha individual em JSON;
- ficha resumida em PDF para impressão;
- Ficha de Esquadrão em PDF/CSV;
- log de sessão em texto/CSV.

Importação deve validar versão/schema.

---

# 61. Seeds iniciais do manual

Criar um processo de seed versionado com:

- funções;
- habilidades exclusivas;
- habilidades gerais;
- traços;
- condições;
- armas;
- equipamentos;
- veículos;
- briefing de QG;
- níveis de Heat;
- fases de Alerta;
- faixas de dificuldade;
- outras tabelas do PDF.

Não criar tudo manualmente dentro de componentes React.

Os seeds precisam ser dados estruturados.

---

# 62. Versionamento das regras

O RPG ainda pode evoluir.

Criar conceito de `rulesetVersion`.

Exemplo:

```text
ruleset: rpg-tatico
version: 0.1-manual-2026-08
```

Quando regras forem alteradas futuramente:

- não quebrar campanhas antigas;
- oferecer migração;
- registrar quais regras foram atualizadas.

---

# 63. Testes automatizados obrigatórios

Criar testes unitários principalmente para o motor de regras.

## Casos mínimos

### Recursos

- alterar Constituição recalcula PV máximo quando essa regra estiver ativa;
- alterar Destreza recalcula Energia máxima quando essa regra estiver ativa;
- Compostura usa `5 + Vontade + Inteligência`;
- PV atual não ultrapassa máximo sem motivo/override, salvo PV temporário separado.

### Estresse

- limite padrão;
- limite temporariamente alterado;
- alerta ao alcançar limite;
- imunidade/efeito configurado respeitado.

### Inventário

- soma de pesos;
- quantidade multiplica peso;
- sobrecarga muda de nível no ponto correto;
- remover item recalcula imediatamente.

### Munição

- semiautomático consome 1;
- rajada consome quantidade definida;
- automático consome seleção válida;
- recarga tática preserva carregador parcial;
- recarga rápida descarta carregador parcial;
- arma sem modo Automático não permite Automático.

### Permissões

- jogador não edita outro personagem;
- jogador não lê nota secreta;
- mestre edita todos;
- campanha A não acessa campanha B.

### Tempo real

Abrir duas sessões de teste:

1. jogador altera Energia;
2. mestre recebe alteração;
3. estado persiste após reload.

### Overrides

- override aparece no cálculo;
- log registra responsável;
- remover override restaura valor calculado.

---

# 64. Testes E2E prioritários

Criar cenários completos.

## Cenário A - Criação e sessão

1. mestre cria campanha;
2. jogador entra via convite;
3. cria personagem;
4. escolhe função;
5. ficha calcula recursos;
6. mestre vê personagem na Ficha de Esquadrão;
7. jogador gasta Energia;
8. mestre vê atualização ao vivo.

## Cenário B - Combate

1. missão passa para Alerta Vermelho;
2. sistema rola contador de reforço;
3. jogador dispara rajada;
4. munição reduz;
5. mestre aplica Suprimido;
6. Defesa/ações mostram modificadores relevantes;
7. rodada avança;
8. condições temporárias atualizam.

## Cenário C - Logística

1. jogador adiciona equipamentos;
2. carga ultrapassa limite;
3. sistema mostra nível de sobrecarga;
4. penalidades aparecem na ficha;
5. mestre remove item;
6. ficha retorna ao estado correto.

## Cenário D - Duelo Social

1. mestre cria alvo;
2. define Compostura;
3. jogador realiza ataque social;
4. mestre aplica dano de CP;
5. CP chega a zero;
6. interface sinaliza Regra de Ruptura sem decidir a consequência narrativa.

---

# 65. UX de erros e confirmações

Evitar alertas genéricos como:

```text
Erro 500
```

Preferir:

```text
Não foi possível atualizar a Energia. Sua ficha não foi alterada. Tente novamente.
```

Para ações importantes:

```text
Descartar carregador com 7 munições restantes?
A Recarga Rápida fará esse carregador deixar de estar disponível.
[Cancelar] [Descartar e recarregar]
```

---

# 66. Estados vazios

Telas vazias precisam orientar o usuário.

Exemplo:

```text
Nenhuma missão ativa.
Crie uma missão para acompanhar Heat, Alerta e estado do esquadrão.
[+ Nova missão]
```

---

# 67. Busca e atalhos

Adicionar busca global ou contextual para:

- regra;
- item;
- habilidade;
- personagem;
- veículo.

Atalhos desejáveis no Escudo do Mestre:

- `/` ou `Ctrl+K`: busca/command palette;
- dano rápido;
- condição rápida;
- próxima rodada.

Não depender desses atalhos para uso normal.

---

# 68. Manual integrado

Desejável criar uma área `Regras` dentro do site.

Ela não precisa republicar o PDF inteiro, mas pode apresentar os dados estruturados utilizados pelo sistema:

- condições;
- habilidades;
- equipamentos;
- regras rápidas;
- tabelas.

Cada item deve mostrar referência de origem.

Adicionar links internos como:

```text
Por que estou com -4 em Furtividade?
→ Ver regra de Sobrecarga Moderada
```

---

# 69. Ficha do Mestre para NPCs - extensão preparada

O MVP pode focar nos jogadores, mas a arquitetura deve permitir posteriormente:

- NPCs;
- inimigos;
- aliados;
- alvos de interrogatório;
- Compostura de NPC;
- PV/Defesa;
- condições;
- notas secretas.

Evitar modelar `Character` de maneira tão rígida que torne NPC impossível.

---

# 70. O que NÃO fazer

Não:

- criar apenas uma ficha visual sem banco;
- usar LocalStorage como única persistência do produto final;
- copiar design de C.R.I.S ou outro site;
- inventar regras faltantes;
- corrigir erros do manual sem autorização;
- transformar texto narrativo em fórmula inventada;
- hardcodar todos os itens diretamente no JSX/HTML;
- permitir que cliente altere dados protegidos sem validação server-side;
- guardar valores derivados sem saber como recalculá-los;
- misturar lógica de regra com CSS/UI;
- esconder inconsistências do manual;
- exigir que mestre abra cinco telas para aplicar uma condição simples;
- usar somente cores para representar PV/Estresse;
- tornar o sistema dependente de uma única resolução de tela;
- criar um VTT completo com mapa/token se isso atrasar o objetivo principal de fichas e gestão do esquadrão.

---

# 71. Ordem de implementação recomendada

## Fase 0 - Auditoria

1. Ler PDF inteiro.
2. Criar `docs/rule-audit.md`.
3. Criar catálogo de regras confirmadas.
4. Mapear ambiguidades.
5. Definir schema.

## Fase 1 - Fundação

1. projeto web;
2. autenticação;
3. banco;
4. campanhas;
5. permissões;
6. design system;
7. realtime básico.

## Fase 2 - Ficha principal

1. personagem;
2. atributos;
3. perícias;
4. recursos;
5. funções;
6. traços;
7. motor de cálculo.

## Fase 3 - Mestre e Esquadrão

1. Escudo do Mestre;
2. Ficha de Esquadrão;
3. quick actions;
4. sincronização ao vivo;
5. audit log.

## Fase 4 - Combate

1. condições;
2. cobertura/postura;
3. armas;
4. carregadores;
5. modos de tiro;
6. rodadas;
7. Aguardar Ângulo.

## Fase 5 - Logística

1. catálogo;
2. inventário;
3. peso;
4. sobrecarga;
5. armaduras;
6. suprimentos.

## Fase 6 - Missões

1. briefing;
2. QG;
3. Heat;
4. Alerta;
5. Ambiente/DT;
6. investigação;
7. veículos.

## Fase 7 - Polimento

1. PWA/offline;
2. exportações;
3. manual integrado;
4. acessibilidade;
5. performance;
6. testes E2E completos.

---

# 72. Definition of Done do MVP

O MVP só pode ser considerado concluído quando:

- [ ] mestre consegue criar uma campanha;
- [ ] jogador consegue entrar na campanha;
- [ ] jogador consegue criar e salvar uma ficha;
- [ ] recursos principais são calculados pela camada de regras;
- [ ] ficha possui PV, Energia, Defesa, Compostura e Estresse;
- [ ] mestre vê todos os personagens em uma única tela;
- [ ] Ficha de Esquadrão existe e é utilizável;
- [ ] alterações do jogador aparecem para o mestre em tempo real;
- [ ] mestre consegue aplicar dano, cura, Energia, Compostura e Estresse rapidamente;
- [ ] condições funcionam;
- [ ] inventário calcula peso;
- [ ] arma controla munição;
- [ ] carregadores suportam Recarga Tática e Recarga Rápida;
- [ ] funções estão cadastradas;
- [ ] habilidades estão cadastradas;
- [ ] Heat e Fase de Alerta existem;
- [ ] QG e Briefing existem;
- [ ] histórico registra alterações importantes;
- [ ] regras ambíguas não foram inventadas silenciosamente;
- [ ] permissões são validadas no servidor;
- [ ] interface funciona em desktop e celular;
- [ ] testes principais passam;
- [ ] conteúdo oficial mantém referência ao manual.

---

# 73. Critério de qualidade visual

O projeto não deve parecer um formulário administrativo genérico.

Ele deve parecer uma ferramenta que os operadores de uma campanha tática realmente utilizariam durante uma missão.

Ao mesmo tempo:

- informação vem antes da decoração;
- valores críticos precisam saltar aos olhos;
- o mestre deve tomar decisões com um olhar;
- a ficha do jogador deve ser rápida;
- não sacrificar acessibilidade por estética.

Uma boa referência conceitual é pensar em três camadas:

```text
FICHA DO JOGADOR = terminal pessoal do operador
FICHA DE ESQUADRÃO = quadro de situação da equipe
ESCUDO DO MESTRE = centro de comando da operação
```

---

# 74. Resultado esperado do Codex

Ao receber este documento e o PDF, siga esta sequência:

1. leia e extraia as regras do PDF;
2. compare com esta especificação;
3. crie a auditoria de inconsistências;
4. proponha o schema final;
5. implemente o motor de regras;
6. implemente banco e autenticação;
7. implemente ficha;
8. implemente Escudo do Mestre;
9. implemente Ficha de Esquadrão;
10. implemente módulos restantes em fases;
11. escreva seeds derivados do manual;
12. crie testes;
13. valide responsividade;
14. valide permissões;
15. documente como rodar localmente e em produção.

Se durante a implementação surgir uma regra que não está clara no PDF, **não interrompa todo o desenvolvimento e não invente resposta**. Registre-a na auditoria, crie configuração/override quando possível e continue com as partes independentes.

---

# 75. Prioridade final

A prioridade do projeto é:

1. **fidelidade ao manual**;
2. **facilidade de uso durante a sessão**;
3. **Escudo do Mestre extremamente eficiente**;
4. **Ficha de Esquadrão legível em segundos**;
5. **automação transparente**;
6. **sincronização confiável**;
7. **design temático e bonito**;
8. **arquitetura extensível**.

Não busque automatizar 100% das decisões narrativas. Busque automatizar 100% da contabilidade repetitiva que o manual permite automatizar com segurança.

---

# 76. Resumo do produto em uma frase

> Construir uma plataforma web de comando tático para RPG em que cada jogador possua uma ficha automatizada e sincronizada, enquanto o mestre acompanha, em uma única central operacional, a condição completa do esquadrão, os recursos da missão e as regras mecânicas definidas pelo `Manual_RPG_Tatico.pdf`.

