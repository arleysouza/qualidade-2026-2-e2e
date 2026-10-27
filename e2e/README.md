# Testes E2E

Requisitos: Node.js 24, Docker em execução e Docker Compose com suporte a `up --wait`.
Execute os comandos na raiz do projeto:

```powershell
npm ci
npx playwright install chromium
npm run test:e2e
```

O comando cria a aplicação completa usando exclusivamente `compose.e2e.yml`,
o projeto Docker `aula4-e2e` e a porta local `18080`. Não usa o `.env` nem o
volume do Compose da demonstração. Reserve esse nome e essa porta para os testes.
O banco não publica portas e usa armazenamento temporário.

Antes de cada cenário, a fixture executa `TRUNCATE` e reaplica `database/seed.sql`
somente no banco `aula4_e2e` desse projeto Docker. Os testes executam em sequência,
com um worker e sem novas tentativas automáticas. Não execute duas suítes ao mesmo tempo.
As operações verificadas passam pela interface, Nginx, Express e PostgreSQL reais,
sem interceptação ou simulação das respostas da API.

## Cenários

- Seleção da operação e prévia da requisição.
- Listagem e busca dos dados iniciais de alunos, disciplinas e matrículas.
- Cadastro de aluno e disciplina, matrícula e consulta após recarregar a página.
- Apresentação de erros HTTP 400, 404 e 409.
- Bloqueio de JSON inválido e recuperação após corrigir o corpo.

## Comandos úteis

```powershell
npm run test:e2e:typecheck
npm run test:e2e:list
npm run test:e2e -- --headed
npm run test:e2e -- --grep "matricula"
npm run test:e2e:report
```

O relatório é servido em `127.0.0.1`, com uma porta disponível escolhida
automaticamente. Acesse o endereço informado no terminal. Mantenha o terminal desse
comando aberto enquanto consulta os resultados. A listagem usa apenas o
reporter de texto para preservar o HTML da última execução.

O script encerra os contêineres ao terminar, inclusive se os testes falharem.
Os logs ficam em `e2e-artifacts/compose.log`; o relatório HTML em
`playwright-report/`; capturas e traces de falhas em `test-results/`.
Após uma interrupção forçada do processo, a limpeza pode ser feita com:

```powershell
docker compose -f compose.e2e.yml -p aula4-e2e down --remove-orphans
```

O Playwright usa esperas de rede e asserções com repetição, sem pausas fixas.
Os seletores usam rótulos e regiões acessíveis; os IDs das operações são
documentados em `front/README.md`.

Referência: [documentação do Playwright Test](https://playwright.dev/docs/intro).
