import { test as base, expect, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const test = base.extend({
  page: async ({ page }, use) => {
    const seed = readFileSync(resolve(__dirname, '../database/seed.sql'), 'utf8');
    const reset = spawnSync('docker', [
      'compose', '-f', 'compose.e2e.yml', '-p', 'aula4-e2e',
      'exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'aula4_e2e',
      '-v', 'ON_ERROR_STOP=1',
    ], {
      cwd: resolve(__dirname, '..'), encoding: 'utf8',
      input: 'TRUNCATE enrollments, courses, students RESTART IDENTITY CASCADE;\n' + seed,
    });
    if (reset.error || reset.status !== 0) {
      throw new Error(`Falha ao restaurar o banco E2E: ${reset.error?.message ?? reset.stderr}`);
    }
    await page.goto('/');
    await use(page);
  },
});
export { expect };

export async function send(page: Page, operation: string, status: number,
  options: { path?: string; body?: unknown } = {}) {
  await page.getByLabel('Operação', { exact: true }).selectOption(operation);
  if (options.path) await page.getByLabel('Caminho do recurso').fill(options.path);
  if (options.body !== undefined) {
    await page.getByLabel('Corpo da requisição · JSON', { exact: true })
      .fill(JSON.stringify(options.body));
  }
  const method = await page.getByLabel('Método', { exact: true }).inputValue();
  const path = await page.getByLabel('Caminho do recurso').inputValue();
  const responsePromise = page.waitForResponse(response =>
    new URL(response.url()).pathname === path && response.request().method() === method);
  await page.getByRole('button', { name: 'Enviar requisição →' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(status);
  await expect(page.getByRole('status')).toContainText(String(status));
  await expect(page.getByRole('status')).toHaveAttribute('data-status-code', String(status));
  await expect(page.getByRole('status')).toHaveAttribute('data-state', status < 400 ? 'success' : 'http-error');
  await expect(page.getByRole('region', { name: 'Resposta', exact: true }))
    .toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('button', { name: 'Enviar requisição →' })).toBeEnabled();
  await expect(page.getByRole('region', { name: 'Headers da resposta', exact: true }))
    .toContainText('application/json');
  const displayed = JSON.parse(await page.getByRole('region', { name: 'Corpo da resposta', exact: true }).innerText());
  expect(displayed).toEqual(await response.json());
  return displayed;
}
