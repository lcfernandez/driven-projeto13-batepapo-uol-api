# driven-projeto13-batepapo-uol-api

* **Projeto #13 - API Bate-papo UOL** do aluno Luiz Cláudio F. Fernandez, Turma 8 da Driven.

---

## Instruções

* Certifique-se de ter o [Git](https://git-scm.com/), [Node](https://nodejs.org/en/) (ou [NVM](https://github.com/nvm-sh/nvm)) e [MongoDB](https://www.mongodb.com/docs/manual/installation/) instalados e configurados.

* Clone o projeto com o comando:

```
https://github.com/lcfernandez/driven-projeto13-batepapo-uol-api
```

* No diretório criado, instale as dependências do projeto com o comando:

```
npm i
```

ou

```
npm install
```

- Com base no arquivo `.env.example`, crie um arquivo `.env` preenchendo as variáveis de acordo com a sua configuração local.
    - Observação: caso as variáveis `MONGO_DB` e `SERVER_PORT` não sejam especificadas, os valores `test` e `5000`, respectivamente, serão utilizados por padrão.

* Rode o projeto no ambiente de desenvolvimento com o comando:

```
npm run dev
```

* Um servidor local estará rodando na porta especificada no `.env` ao serem retornadas as mensagens:

```
MongoDB connected
Server running in port: <porta-especificada>
```