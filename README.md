[View on GitHub](https://github.com/kernelpenguin/arbtr)

# Arbeiters

*Arbeiters is a monorepo containing a suite of applications, including a backend server, a landing page, and a scraper fleet.*

Este é um monorepo que contém uma suíte de aplicações, incluindo um servidor de backend, uma landing page e uma frota de scrapers.

---

## ❯ Getting Started / Primeiros Passos

To get started with this project, you first need to install the dependencies for all the applications from the root of the monorepo.

*Para começar a trabalhar neste projeto, primeiro você precisa instalar as dependências de todas as aplicações a partir da raiz do monorepo.*

```bash
npm install
```

This will install the dependencies for all the applications located in the `apps/` directory.

*Isso instalará as dependências para todas as aplicações localizadas no diretório `apps/`.*

---

## ❯ Running the Applications / Executando as Aplicações

Each application can be run from the root of the monorepo using the `npm run <script> -w <workspace>` command.

*Cada aplicação pode ser executada a partir da raiz do monorepo usando o comando `npm run <script> -w <workspace>`.*

### Backend

To run the backend server in development mode (with hot-reloading):

*Para executar o servidor de backend em modo de desenvolvimento (com hot-reloading):*

```bash
npm run dev -w backend
```

### Landing Page

To run the Angular landing page in development mode:

*Para executar a landing page em Angular em modo de desenvolvimento:*

```bash
npm run start -w landing-page
```

### Scraper Fleet

The scraper fleet does not have a dedicated start script. It is a TypeScript project that can be built.

*A frota de scrapers não possui um script de início dedicado. É um projeto TypeScript que pode ser compilado.*

---

## ❯ Building the Applications / Compilando as Aplicações

### Backend

To build the backend for production:

*Para compilar o backend para produção:*

```bash
npm run build -w backend
```

The compiled output will be in `apps/backend/dist/`.

*O resultado da compilação estará em `apps/backend/dist/`.*

### Landing Page

To build the landing page for production:

*Para compilar a landing page para produção:*

```bash
npm run build -w landing-page
```

The compiled output will be in `apps/landing-page/dist/`.

*O resultado da compilação estará em `apps/landing-page/dist/`.*

---

## ❯ About this Monorepo / Sobre este Monorepo

This project is a monorepo that uses NPM Workspaces. The applications are located in the `apps/` directory:

*Este projeto é um monorepo que usa NPM Workspaces. As aplicações estão localizadas no diretório `apps/`:*

-   `apps/backend`: An Express.js server in TypeScript. / *Um servidor Express.js em TypeScript.*
-   `apps/landing-page`: An Angular application for the user interface. / *Uma aplicação Angular para a interface do usuário.*
-   `apps/scraper-fleet`: A fleet of scrapers. / *Uma frota de scrapers.*
-   `packages/shared`: Shared packages used by the applications. / *Pacotes compartilhados usados pelas aplicações.*

---

## ❯ License / Licença

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.*
