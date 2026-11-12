# Estudaí

Aplicativo mobile para estudantes organizarem a vida acadêmica: matérias e conteúdos do semestre, tarefas do dia, provas e trabalhos na agenda e lembretes antes das datas importantes.

Trabalho final da disciplina Programação de App (Engenharia de Software, UCB, 2026/2).

[![CI](https://github.com/Takesh0s/estudai/actions/workflows/ci.yml/badge.svg)](https://github.com/Takesh0s/estudai/actions/workflows/ci.yml) ![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

## Sumário

- [Visão geral](#visão-geral)
- [Checklist da entrega](#checklist-da-entrega)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como executar](#como-executar)
- [Configuração](#configuração)
- [Banco de dados](#banco-de-dados)
- [Qualidade](#qualidade)
- [Fluxo de trabalho](#fluxo-de-trabalho)
- [Design](#design)
- [Equipe](#equipe)
- [Licença](#licença)

## Visão geral

- **Matérias:** cada matéria do semestre reúne seus conteúdos, marcados como *a estudar*, *estudando* ou *revisado*, e mostra o progresso de revisão.
- **Início:** a próxima prova, as tarefas do dia e o que vem nos próximos dias.
- **Agenda:** visão semanal e calendário mensal e anual com provas, trabalhos e outras datas.
- **Lembretes:** notificações locais antes de provas e trabalhos, com antecedência e horário escolhidos pelo usuário.
- **Conta:** cadastro, login, recuperação de senha por código, tema claro ou escuro e exclusão da conta com todos os dados.

## Checklist da entrega

Entrega em 17/11, com apresentação em 17 ou 24/11. Um item só é marcado quando já está na `develop`.

### Requisitos do trabalho

- [x] App em React Native (Expo SDK 58 com TypeScript)
- [x] Pelo menos 4 telas interativas: acesso, Início, Matérias, Agenda, Calendário, Perfil e formulários
- [x] Requisição a web service: autenticação, banco e storage do Supabase via HTTPS
- [x] Requisição a uma API pública: feriados nacionais da BrasilAPI na Agenda
- [x] Persistência de dados: PostgreSQL no Supabase e preferências no aparelho com AsyncStorage
- [x] Notificação: lembretes locais antes de provas e trabalhos
- [x] Finalidade além de mostrar informações: o usuário cadastra matérias, conteúdos, tarefas e eventos
- [x] Não é app de consulta de filmes ou livros
- [ ] Todos os tópicos vistos em sala até a apresentação, conferidos com os slides da disciplina
- [x] Versionado no GitHub seguindo o Git Flow

### Git Flow

- [x] `main` recebe só versões fechadas, cada uma com tag (`v0.1.0`, `v0.1.1`)
- [x] `develop` integra o trabalho em andamento
- [x] Cada funcionalidade em uma `feature/*` criada a partir da `develop`
- [x] Toda mudança entra por pull request, com merge commit para manter o histórico da branch
- [x] Branches apagadas depois do merge
- [x] Commits no padrão Conventional Commits
- [x] CI com lint, checagem de tipos e testes automatizados em todo push e pull request
- [x] `main` e `develop` protegidas no GitHub: sem push direto, só merge commit e CI verde para o merge
- [x] Commits e pull requests das duas pessoas da equipe
- [x] Versão de documentação fechada em uma `release/v0.1.1`
- [ ] Versão de entrega fechada em uma `release/v1.0.0`, aberta a partir da `develop`
- [ ] Correções depois da entrega em `hotfix/*`, a partir da `main`

### Funcionalidades

- [x] Cadastro, login com "Lembrar login" e saída com confirmação
- [x] Recuperação de senha por código enviado por e-mail
- [x] Tema claro e escuro, com a escolha salva no aparelho
- [x] Banco com RLS em todas as tabelas, perfil criado no cadastro e exclusão de conta
- [x] Matérias e conteúdos (`feature/subjects`)
- [x] Início: próxima prova, tarefas do dia e próximos dias (`feature/home`)
- [x] Agenda, calendário e feriados nacionais (`feature/schedule`)
- [x] Lembretes de provas e trabalhos (`feature/notifications`)
- [x] Perfil: edição, foto, senha, preferências de lembrete, ajuda, termos e exclusão de conta (`feature/profile`)
- [ ] Versão `v1.0.0` publicada

## Arquitetura

```
┌──────────────────────────────┐
│  Aplicativo (Expo)           │
│  screens → contexts → lib    │
└───────┬──────────────┬───────┘
        │ HTTPS        │ HTTPS
        ▼              ▼
┌────────────────┐  ┌────────────┐
│ Supabase       │  │ BrasilAPI  │
│ Auth           │  │ feriados   │
│ PostgreSQL+RLS │  └────────────┘
│ Storage        │
└────────────────┘
```

O app não tem backend próprio: ele conversa direto com o Supabase. Decisões principais:

- **Segurança no banco:** a chave do Supabase que vai dentro do app é pública por definição. Quem impede um usuário de ler ou alterar dados de outro são as políticas de RLS, presentes em todas as tabelas. O schema completo está em [`supabase/schema.sql`](supabase/schema.sql).
- **Dados em um só lugar:** matérias, conteúdos, tarefas e eventos são carregados uma vez no `DataContext` e as telas derivam o que precisam deles; cada escrita vai primeiro ao Supabase e depois atualiza as listas locais (marcar tarefa e mudar status de conteúdo são otimistas, com rollback em caso de erro).
- **Lembretes locais:** não há servidor de push. O `DataContext` mantém as notificações agendadas no aparelho (`expo-notifications`) alinhadas aos eventos e às preferências do perfil: a cada mudança, cancela tudo e agenda de novo os próximos avisos (no máximo 60, porque o iOS limita as notificações locais pendentes a 64). Prova usa as preferências de prova; trabalho, atividade e outros usam as de trabalho. O horário do aviso é `dia do evento − antecedência` no horário escolhido.
- **Feriados:** a BrasilAPI é consultada uma vez por ano e a resposta fica em memória e no AsyncStorage; sem internet, a agenda funciona sem os feriados.
- **Sessão em um só lugar:** login, cadastro e recuperação de senha ficam no `AuthContext`; as telas não acessam `supabase.auth` diretamente. O `RootNavigator` alterna entre o fluxo de acesso e o app conforme a sessão, então entrar e sair não depende de `navigate()`.
- **Recuperação por código:** a senha é redefinida com o código de 6 dígitos enviado por e-mail, não pelo link. O link precisaria reabrir o app por deep link, e no Expo Go esse endereço muda junto com o servidor de desenvolvimento.
- **Perfil pelo banco:** um trigger cria o perfil no cadastro, com o nome informado. Excluir a conta remove o usuário do Auth e, em cascata, tudo o que pertence a ele.
- **Tema por tokens:** `src/theme/colors.ts` espelha as variáveis de cor do Figma. As telas leem as cores do tema, e por isso o modo escuro não exige nenhuma condição nelas.
- **Navegação explícita:** React Navigation com pilha, abas e modais declarados em código, no lugar do roteamento por arquivos do Expo Router.

## Stack

- Expo SDK 58, React Native 0.88, React 19 e TypeScript 6
- React Navigation 7 (native stack e bottom tabs)
- Supabase: Auth, PostgreSQL e Storage, via `supabase-js`
- expo-notifications (lembretes locais), expo-image-picker (foto de perfil), @react-native-community/datetimepicker (data e hora)
- AsyncStorage, react-native-svg, expo-splash-screen, fonte Inter
- ESLint (`eslint-config-expo`), Jest (`jest-expo`), React Native Testing Library e GitHub Actions

## Estrutura do repositório

```
.
├── App.tsx                 provedores, fontes, splash e navegação
├── app.json                nome, ícones e splash (claro e escuro)
├── assets/                 ícone do app e imagens da splash
├── supabase/schema.sql     tabelas, RLS, triggers e storage
├── src/
│   ├── components/
│   │   ├── icons/          ícones SVG e logo
│   │   ├── ui/             botões, campos, cards, chips, diálogos e estados vazios
│   │   ├── DataGate.tsx    carregamento e erro das abas
│   │   └── EventCards.tsx  cartões de evento e de feriado
│   ├── contexts/           sessão e autenticação; dados de estudo
│   ├── lib/                cliente Supabase, tipos do banco, datas, feriados,
│   │                       notificações e utilitários
│   ├── navigation/         navegadores e tipos de rota
│   ├── screens/
│   │   ├── auth/           login, cadastro e recuperação de senha
│   │   └── app/            Início, Matérias, Agenda, Calendário, Perfil,
│   │                       formulários e telas de apoio (ajuda, termos, senha)
│   └── theme/              cores, tipografia, medidas e tema
└── .github/workflows/      CI
```

## Como executar

### Pré-requisitos

- Node.js LTS
- Expo Go no celular, em versão compatível com o SDK 58 (atualize pela loja se o app recusar o projeto)
- Um projeto no [Supabase](https://supabase.com) (o plano gratuito basta)

### Supabase

1. No **SQL Editor**, execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
2. Em **Authentication > Emails**, edite o modelo **Reset password** para exibir o código, por exemplo:

   ```html
   <p>Use este código no Estudaí para criar uma nova senha:</p>
   <h2>{{ .Token }}</h2>
   ```

3. Nas configurações do provedor **Email**, defina o tamanho mínimo de senha como 8. Para desenvolvimento, desligue também **Confirm email**: o servidor de e-mail padrão do Supabase envia só cerca de dois e-mails por hora.

### Aplicativo

```bash
npm install
cp .env.example .env
npx expo start
```

No Windows, troque o `cp` por `copy`. Preencha o `.env` (veja [Configuração](#configuração)) e escaneie o QR code com o Expo Go. Depois de alterar o `.env`, reinicie com `npx expo start --clear`.

## Configuração

| Variável | Descrição |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto (Project Settings > API) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave *publishable* do projeto |

Sem essas variáveis o app abre uma tela explicando o que falta configurar. O `.env` não é versionado.

## Banco de dados

| Tabela | Conteúdo |
| --- | --- |
| `profiles` | Nome, foto e preferências de lembrete; uma linha por usuário |
| `subjects` | Matérias, com professor e cor |
| `contents` | Conteúdos de cada matéria e seu status de estudo |
| `tasks` | Tarefas com data, ligadas ou não a uma matéria |
| `events` | Provas, trabalhos e outras datas da agenda |

As fotos de perfil ficam no bucket `avatars`, em uma pasta por usuário. Os tipos TypeScript correspondentes estão em `src/lib/database.types.ts` e precisam acompanhar qualquer mudança no schema.

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
```

O GitHub Actions executa os três a cada push em `main` e `develop` e em todo pull request. Os testes rodam com Node.js 22.13 ou mais novo.

Os testes ficam em pastas `__tests__`, ao lado do código que testam:

| Onde | O que cobre |
| --- | --- |
| `src/lib/__tests__` | Datas e calendário, agrupamento e urgência de eventos, rótulos, mensagens de erro do login, cache dos feriados da BrasilAPI e agendamento dos lembretes |
| `src/components/ui/__tests__` | Botão, campo de texto, checkbox, diálogo de confirmação, estado vazio, chip, seletor de cor, barra de progresso e linha de configuração |
| `src/theme/__tests__` | Troca de tema e preferência salva no aparelho |

Rede e notificações são simuladas, então os testes não dependem de internet nem de celular.

## Fluxo de trabalho

O repositório segue o Git Flow. `main` e `develop` são protegidas: ninguém faz push direto nelas, e o merge só é liberado com a CI verde.

| Branch | Sai de | Volta para | Uso |
| --- | --- | --- | --- |
| `main` | — | — | Versões entregues, com tag |
| `develop` | `main` | `main`, via `release/*` | Integração do trabalho em andamento |
| `feature/<nome>` | `develop` | `develop` | Uma funcionalidade ou ajuste |
| `release/<versão>` | `develop` | `main` e `develop` | Fechamento de uma versão: só correções |
| `hotfix/<nome>` | `main` | `main` e `develop` | Correção urgente em versão já entregue |

Para começar uma funcionalidade:

```bash
git checkout develop
git pull
git checkout -b feature/<nome>
```

Antes de abrir o pull request, rode `npm run lint`, `npm run typecheck` e `npm test`. O pull request vai para a `develop`, com o que mudou e como testar, e só entra depois que a CI passa. Use **Create a merge commit** e apague a branch em seguida.

As mensagens de commit seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/), no formato `tipo(escopo): descrição`: `feat(subjects): add subject list screen`, `fix(auth): keep session after password reset`, `docs: update delivery checklist`.

Configure o Git com o e-mail da sua conta do GitHub (`git config user.email`). Assim os commits aparecem no seu perfil e contam como contribuição.

## Design

O protótipo de alta fidelidade, com os modos claro e escuro e a biblioteca de componentes, está no [Figma](https://www.figma.com/design/Zelc6hICqvzEmtxzxKKHka/Estuda%C3%AD?node-id=2063-826&t=rUpACUPgXkL1lROO-1).

## Equipe

| Integrante | Atuação |
| --- | --- |
| Luiz Phillipe de Souza Santos | Desenvolvimento do aplicativo, arquitetura, banco de dados e design de alta fidelidade |
| Yohanna Araújo da Silva | Desenvolvimento do aplicativo, concepção do produto, protótipo no Figma e documentação |

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).