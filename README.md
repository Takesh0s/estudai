# Estudaí

Aplicativo mobile para estudantes organizarem a vida acadêmica: matérias e conteúdos do semestre, tarefas do dia, provas e trabalhos na agenda e lembretes antes das datas importantes.

Trabalho final da disciplina Programação de App (Engenharia de Software, UCB, 2026/2).

[![CI](https://github.com/Takesh0s/estudai/actions/workflows/ci.yml/badge.svg)](https://github.com/Takesh0s/estudai/actions/workflows/ci.yml) ![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

## Sumário

- [Visão geral](#visão-geral)
- [Status](#status)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como executar](#como-executar)
- [Configuração](#configuração)
- [Banco de dados](#banco-de-dados)
- [Qualidade](#qualidade)
- [Fluxo de trabalho](#fluxo-de-trabalho)
- [Roadmap](#roadmap)
- [Design](#design)
- [Equipe](#equipe)
- [Licença](#licença)

## Visão geral

- **Matérias:** cada matéria do semestre reúne seus conteúdos, marcados como *a estudar*, *estudando* ou *revisado*, e mostra o progresso de revisão.
- **Início:** a próxima prova, as tarefas do dia e o que vem nos próximos dias.
- **Agenda:** visão semanal e calendário mensal e anual com provas, trabalhos e outras datas.
- **Lembretes:** notificações locais antes de provas e trabalhos, com antecedência e horário escolhidos pelo usuário.
- **Conta:** cadastro, login, recuperação de senha por código, tema claro ou escuro e exclusão da conta com todos os dados.

## Status

| Área | Situação |
| --- | --- |
| Acesso: login, cadastro, recuperação de senha e saída | Implementado |
| Tema claro e escuro com preferência salva no aparelho | Implementado |
| Banco de dados com RLS, perfis e exclusão de conta | Implementado |
| Matérias e conteúdos | Planejado |
| Início (próxima prova, tarefas, próximos dias) | Planejado |
| Agenda, calendário e feriados nacionais (BrasilAPI) | Planejado |
| Lembretes por notificação local | Planejado |
| Perfil: edição, foto e preferências de lembrete | Planejado |

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
- **Sessão em um só lugar:** login, cadastro e recuperação de senha ficam no `AuthContext`; as telas não acessam `supabase.auth` diretamente. O `RootNavigator` alterna entre o fluxo de acesso e o app conforme a sessão, então entrar e sair não depende de `navigate()`.
- **Recuperação por código:** a senha é redefinida com o código de 6 dígitos enviado por e-mail, não pelo link. O link precisaria reabrir o app por deep link, e no Expo Go esse endereço muda junto com o servidor de desenvolvimento.
- **Perfil pelo banco:** um trigger cria o perfil no cadastro, com o nome informado. Excluir a conta remove o usuário do Auth e, em cascata, tudo o que pertence a ele.
- **Tema por tokens:** `src/theme/colors.ts` espelha as variáveis de cor do Figma. As telas leem as cores do tema, e por isso o modo escuro não exige nenhuma condição nelas.
- **Navegação explícita:** React Navigation com pilha, abas e modais declarados em código, no lugar do roteamento por arquivos do Expo Router.

## Stack

- Expo SDK 58, React Native 0.88, React 19 e TypeScript 6
- React Navigation 7 (native stack e bottom tabs)
- Supabase: Auth, PostgreSQL e Storage, via `supabase-js`
- AsyncStorage, react-native-svg, expo-splash-screen, fonte Inter
- ESLint (`eslint-config-expo`) e GitHub Actions

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
│   │   └── ui/             botões, campos, diálogos e estados vazios
│   ├── contexts/           sessão e autenticação
│   ├── lib/                cliente Supabase, tipos do banco e utilitários
│   ├── navigation/         navegadores e tipos de rota
│   ├── screens/
│   │   ├── auth/           login, cadastro e recuperação de senha
│   │   └── app/            Início, Matérias, Agenda e Perfil
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
```

O GitHub Actions executa os dois a cada push em `main` e `develop` e em todo pull request.

## Fluxo de trabalho

O repositório segue o Git Flow: `main` guarda as versões entregues, `develop` integra o trabalho em andamento e cada funcionalidade nasce em uma branch `feature/*` a partir de `develop`, voltando por pull request. As mensagens de commit seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/).

## Roadmap

- Matérias e conteúdos (criação, edição, exclusão e status)
- Início com próxima prova, tarefas do dia e próximos dias
- Agenda semanal, calendário mensal e anual e feriados nacionais
- Lembretes de provas e trabalhos com notificações locais
- Edição de perfil, foto, preferências de lembrete, ajuda e termos de uso

## Design

O protótipo de alta fidelidade, com os modos claro e escuro e a biblioteca de componentes, está no [Figma](https://www.figma.com/design/Zelc6hICqvzEmtxzxKKHka/Estuda%C3%AD?node-id=2063-826&t=rUpACUPgXkL1lROO-1).

## Equipe

| Integrante | Atuação |
| --- | --- |
| Luiz Phillipe de Souza Santos | Desenvolvimento do aplicativo, arquitetura, banco de dados e design de alta fidelidade |
| Yohanna Araújo da Silva | Desenvolvimento do aplicativo, concepção do produto, protótipo no Figma e documentação |

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).
