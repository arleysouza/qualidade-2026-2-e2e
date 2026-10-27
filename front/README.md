# Interface e automação E2E

Prefira localizar campos pelos rótulos e o botão pelo nome “Enviar requisição →”.
As regiões “Requisição preparada”, “Headers da resposta” e “Corpo da resposta”
possuem nomes acessíveis e podem ser localizadas por `getByRole("region", { name })`.

O seletor “Operação” usa valores fixos, independentes da posição das opções:

| Recurso | Listar | Buscar | Criar |
| --- | --- | --- | --- |
| Alunos | `students-list` | `students-get` | `students-create` |
| Disciplinas | `courses-list` | `courses-get` | `courses-create` |
| Matrículas | `enrollments-list` | `enrollments-get` | `enrollments-create` |

Os exemplos de erro usam `error-400`, `error-404` e `error-409`.

## Conclusão da requisição

`#response` informa `aria-busy="true"` durante o envio e `false` ao terminar.
O botão fica desabilitado durante a requisição e é reabilitado ao concluir.
`#status` expõe os seguintes atributos:

- `data-state`: `idle`, `loading`, `success`, `http-error`, `validation-error` ou `network-error`.
- `data-status-code`: código HTTP recebido, disponível após a leitura completa do corpo.
  É removido no próximo envio; erros locais ou de rede não possuem código HTTP.

Para envios consecutivos com o mesmo resultado, registre a espera pela resposta
de rede antes do clique, aguarde essa resposta e depois confira o estado final e
o conteúdo da região. Não dependa de observar o estado transitório `loading`,
pois uma resposta rápida pode encerrá-lo antes da próxima asserção.

Os IDs existentes foram preservados. A suíte E2E está documentada em
[e2e/README.md](../e2e/README.md). Os exemplos de busca e de matrícula duplicada
pressupõem os dados de `database/seed.sql`; cenários de criação devem preparar
seus dados em um banco isolado.
