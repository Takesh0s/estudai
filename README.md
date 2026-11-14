# Estudaí

Aplicativo mobile para estudantes organizarem a vida acadêmica: matérias e conteúdos do semestre, tarefas do dia, provas e trabalhos na agenda e lembretes antes das datas importantes.

Trabalho final da disciplina Programação de App (Engenharia de Software, UCB, 2026/2).

[![CI](https://github.com/Takesh0s/estudai/actions/workflows/ci.yml/badge.svg)](https://github.com/Takesh0s/estudai/actions/workflows/ci.yml) ![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

## Sumário

- [Visão geral](#visão-geral)
- [Requisitos da disciplina](#requisitos-da-disciplina)
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
- **Agenda:** visão semanal e calendários mensal e anual com provas, trabalhos, outras datas e feriados nacionais.
- **Lembretes:** duas notificações locais por evento, uma antecipada, com antecedência e horário definidos pelo usuário, e outra na hora do evento. Pela própria notificação é possível adiar o aviso em 1 hora ou abrir o dia na agenda.
- **Conta:** cadastro, login, recuperação de senha por código, tema claro ou escuro e exclusão da conta com todos os dados.

## Requisitos da disciplina

| Requisito | Como o app atende |
| --- | --- |
| Telas interativas | Acesso, Início, Matérias, Agenda, Calendário, Perfil e formulários de cadastro e edição |
| Requisição a web services | Supabase (Auth, PostgreSQL e Storage) e feriados nacionais da [BrasilAPI](https://brasilapi.com.br) |
| Persistência de dados | PostgreSQL no Supabase para dados do usuário, SQLite para o cache dos feriados, SecureStore para o token da sessão e AsyncStorage para preferências |
| Notificação | Lembretes locais antes e na hora de provas e trabalhos, com ações para adiar e abrir a agenda |
| Git Flow | `main`, `develop`, `feature/*`, `release/*` e `hotfix/*`, com pull requests revisados (veja [Fluxo de trabalho](#fluxo-de-trabalho)) |

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

O app não tem backend próprio e se comunica diretamente com o Supabase. Principais decisões:

- **Segurança no banco:** a chave do Supabase embarcada no app é pública por definição. O isolamento entre usuários é garantido pelas políticas de RLS, ativas em todas as tabelas ([`supabase/schema.sql`](supabase/schema.sql)).
- **Estado de dados centralizado:** matérias, conteúdos, tarefas e eventos são carregados uma vez no `DataContext`, e as telas derivam o que precisam. Cada escrita vai ao Supabase e depois atualiza o estado local; marcar tarefas e mudar o status de conteúdos são atualizações otimistas, com rollback em caso de erro.
- **Persistência por tipo de dado:** o token da sessão é uma credencial e fica no `expo-secure-store` (Keychain no iOS, Keystore no Android), dividido em partes por causa do limite de tamanho por valor. Os feriados são registros estruturados e ficam em uma tabela do `expo-sqlite`, consultada por ano. Preferências simples, como tema e "lembrar login", ficam no AsyncStorage. Sessões gravadas por versões anteriores no AsyncStorage são migradas na primeira leitura.
- **Lembretes locais:** o `DataContext` mantém as notificações agendadas (`expo-notifications`) sincronizadas com os eventos e as preferências do perfil, com no máximo 60 pendentes por causa do limite de 64 do iOS. Cada evento gera um aviso antecipado, no horário escolhido pelo usuário, e outro no início do evento. As ações da notificação são tratadas em `useReminderResponses`.
- **Feriados:** a BrasilAPI é consultada uma vez por ano. Sem conexão, a agenda continua funcionando, apenas sem os feriados.
- **Autenticação isolada:** login, cadastro e recuperação de senha ficam no `AuthContext`, e as telas não acessam `supabase.auth` diretamente. O `RootNavigator` alterna entre o fluxo de acesso e o app conforme a sessão.
- **Recuperação por código:** a senha é redefinida com um código de 6 dígitos enviado por e-mail, em vez de link, porque o deep link do Expo Go muda junto com o servidor de desenvolvimento.
- **Perfil gerenciado pelo banco:** um trigger cria o perfil no cadastro, e a exclusão da conta remove em cascata todos os dados do usuário.
- **Tema por tokens:** `src/theme/colors.ts` espelha as variáveis de cor do Figma, e por isso o modo escuro não exige condicionais nas telas.
- **Navegação explícita:** React Navigation com pilha, abas e modais declarados em código.

## Stack

- Expo SDK 58, React Native 0.88, React 19 e TypeScript 6
- React Navigation 7 (native stack e bottom tabs)
- Supabase: Auth, PostgreSQL e Storage, via `supabase-js`
- expo-notifications (lembretes locais), expo-image-picker (foto de perfil), @react-native-community/datetimepicker (data e hora), expo-system-ui (fundo da raiz no tema, sem clarão nas transições)
- expo-secure-store, expo-sqlite e AsyncStorage (persistência local)
- react-native-svg, expo-splash-screen e fonte Inter
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
| `src/lib/__tests__` | Datas e calendário, agrupamento e urgência de eventos, rótulos, mensagens de erro do login, cache dos feriados da BrasilAPI em SQLite, sessão no SecureStore, agendamento e adiamento dos lembretes |
| `src/navigation/__tests__` | Resposta aos botões da notificação: adiar, abrir a agenda no dia do evento e tratar cada toque uma vez só |
| `src/components/ui/__tests__` | Avatar, botão, campo de texto, checkbox, diálogo de confirmação, estado vazio, chip, seletor de cor, slider, barra de progresso e linha de configuração |
| `src/theme/__tests__` | Troca de tema e preferência salva no aparelho |

Rede e notificações são simuladas, então os testes não dependem de internet nem de celular.

## Fluxo de trabalho

O repositório segue o Git Flow. `main` e `develop` são protegidas: não aceitam push direto, e o merge exige pull request com uma aprovação e a CI verde.

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

Antes de abrir o pull request, rode `npm run lint`, `npm run typecheck` e `npm test`. O pull request vai para a `develop`, com o que mudou e como testar, e entra depois da revisão e da CI. Use **Create a merge commit** e apague a branch em seguida.

As mensagens de commit seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/), no formato `tipo(escopo): descrição`: `feat(subjects): add subject list screen`, `fix(auth): keep session after password reset`, `docs: update setup instructions`.

## Design

O protótipo de alta fidelidade, com os modos claro e escuro e a biblioteca de componentes, está no [Figma](https://www.figma.com/design/Zelc6hICqvzEmtxzxKKHka/Estuda%C3%AD?node-id=2063-826&t=rUpACUPgXkL1lROO-1).

## Equipe

| Integrante | Atuação |
| --- | --- |
| Luiz Phillipe de Souza Santos | Desenvolvimento do aplicativo, arquitetura, banco de dados e design de alta fidelidade |
| Yohanna Araújo da Silva | Desenvolvimento do aplicativo, concepção do produto, protótipo no Figma e documentação |

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).