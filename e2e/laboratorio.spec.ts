import { test, expect, send } from './support';

test('cadastra um aluno pela interface', async ({ page }) => {
  await page.getByLabel('Operação', { exact: true })
    .selectOption('students-create');

  await page.getByLabel('Corpo da requisição · JSON', { exact: true })
    .fill(JSON.stringify({
      ra: 900003,
      name: 'Mariana',
    }));

  await page.getByRole('button', { name: 'Enviar requisição →' }).click();

  await expect(page.getByRole('status')).toContainText('201');
  await expect(page.getByRole('region', {
    name: 'Corpo da resposta',
    exact: true,
  })).toContainText('Mariana');
});

test('seleciona operações e prepara a requisição', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Laboratório REST.' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveAttribute('data-state', 'idle');
  await expect(page.getByLabel('Corpo da requisição · JSON', { exact: true })).toBeDisabled();
  await page.getByLabel('Operação', { exact: true }).selectOption('students-create');
  await expect(page.getByLabel('Método', { exact: true })).toHaveValue('POST');
  await expect(page.getByLabel('Caminho do recurso')).toHaveValue('/api/students');
  await page.getByLabel('Corpo da requisição · JSON', { exact: true }).fill('{"ra":900001,"name":"Aluno E2E"}');
  const preview = page.getByRole('region', { name: 'Requisição preparada', exact: true });
  await expect(preview).toContainText('POST http://127.0.0.1:18080/api/students');
  await expect(preview).toContainText('Content-Type: application/json');
  await expect(preview).toContainText('Aluno E2E');
});

for (const scenario of [
  { operation: 'students-list', size: 3, item: { ra: 258001, name: 'Ana Clara Silva' } },
  { operation: 'courses-list', size: 39, item: { id: 13, name: 'Desenvolvimento Web III' } },
  { operation: 'enrollments-list', size: 22, item: { studentRa: 258001, courseId: 1 } },
]) {
  test(`lista dados iniciais: ${scenario.operation}`, async ({ page }) => {
    const body = await send(page, scenario.operation, 200);
    expect(body).toHaveLength(scenario.size);
    expect(body).toEqual(expect.arrayContaining([expect.objectContaining(scenario.item)]));
  });
}

for (const scenario of [
  { operation: 'students-get', item: { ra: 258001, name: 'Ana Clara Silva' } },
  { operation: 'courses-get', item: { id: 13, name: 'Desenvolvimento Web III' } },
  { operation: 'enrollments-get', item: { studentRa: 258001, courseId: 1 } },
]) {
  test(`busca registro inicial: ${scenario.operation}`, async ({ page }) => {
    expect(await send(page, scenario.operation, 200)).toMatchObject(scenario.item);
  });
}

test('cadastra aluno e disciplina, matricula e consulta após recarregar', async ({ page }) => {
  const student = { ra: 900001, name: 'Aluno E2E' };
  expect(await send(page, 'students-create', 201, { body: student })).toEqual(student);
  const course = await send(page, 'courses-create', 201, { body: { name: 'Disciplina E2E' } });
  expect(course).toEqual({ id: expect.any(Number), name: 'Disciplina E2E' });
  const keys = { studentRa: student.ra, courseId: course.id };
  const enrollment = await send(page, 'enrollments-create', 201, { body: keys });
  expect(enrollment).toMatchObject(keys);
  expect(Number.isNaN(Date.parse(enrollment.enrolledAt))).toBe(false);
  await page.reload();
  expect(await send(page, 'students-get', 200, { path: `/api/students/${student.ra}` })).toEqual(student);
  expect(await send(page, 'courses-get', 200, { path: `/api/courses/${course.id}` })).toEqual(course);
  expect(await send(page, 'enrollments-get', 200, {
    path: `/api/enrollments/student/${student.ra}/course/${course.id}`,
  })).toEqual(enrollment);
});

for (const status of [400, 404, 409]) {
  test(`apresenta erro HTTP ${status}`, async ({ page }) => {
    const body = await send(page, `error-${status}`, status);
    expect(body).toMatchObject({ statusCode: status, message: expect.any(String), error: expect.any(String) });
    await expect(page.getByRole('status')).toContainText(String(status));
  });
}

test('bloqueia JSON inválido e permite corrigir e reenviar', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());
  });
  await page.getByLabel('Operação', { exact: true }).selectOption('students-create');
  await page.getByLabel('Corpo da requisição · JSON', { exact: true }).fill('{');
  await page.getByRole('button', { name: 'Enviar requisição →' }).click();
  await expect(page.getByRole('status')).toHaveAttribute('data-state', 'validation-error');
  await expect(page.getByRole('status')).toHaveText('Requisição não enviada');
  expect(requests).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Enviar requisição →' })).toBeEnabled();
  expect(await send(page, 'students-create', 201, {
    body: { ra: 900002, name: 'JSON corrigido' },
  })).toEqual({ ra: 900002, name: 'JSON corrigido' });
});
