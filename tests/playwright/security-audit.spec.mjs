import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'javascript-disabled') {
    await page.goto('/module-shell');
    return;
  }
  if (testInfo.project.metadata.renderMode === 'canvas') {
    await page.addInitScript(() => { window.STOA_SECURITY_RENDER_MODE = 'canvas'; });
  }
  await page.goto('/module');
  await expect(page.locator('html')).toHaveClass(/stoa-security-active/);
});

test('la coquille sans JavaScript ne contient aucun contenu de leçon', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'javascript-disabled');
  await expect(page.locator('#lesson-copy')).toBeEmpty();
  await expect(page.locator('body')).not.toContainText('Texte pédagogique confidentiel');
});

test('le clic droit et la sélection sont annulés', async ({ page }, testInfo) => {
  test.skip(['javascript-disabled', 'canvas-chromium'].includes(testInfo.project.name));
  const result = await page.locator('#protected-text').evaluate((element) => {
    const contextAllowed = element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    const selectionAllowed = element.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true }));
    return { contextPrevented: !contextAllowed, selectionPrevented: !selectionAllowed };
  });
  expect(result).toEqual({ contextPrevented: true, selectionPrevented: true });
});

test('une sélection DOM est immédiatement vidée', async ({ page }, testInfo) => {
  test.skip(['javascript-disabled', 'canvas-chromium'].includes(testInfo.project.name));
  const selected = await page.locator('#protected-text').evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    return selection.toString();
  });
  expect(selected).toBe('');
});

test('copie, coupe et glisser-déposer sont neutralisés', async ({ page }, testInfo) => {
  test.skip(['javascript-disabled', 'canvas-chromium'].includes(testInfo.project.name));
  const result = await page.locator('#protected-text').evaluate((element) => {
    const clipboard = { value: '', setData(_type, value) { this.value = value; } };
    const event = (name) => {
      const item = new Event(name, { bubbles: true, cancelable: true });
      if (name === 'copy' || name === 'cut') Object.defineProperty(item, 'clipboardData', { value: clipboard });
      return !element.dispatchEvent(item);
    };
    return { copy: event('copy'), cut: event('cut'), drag: event('dragstart'), clipboard: clipboard.value };
  });
  expect(result).toEqual({ copy: true, cut: true, drag: true, clipboard: 'Contenu réservé aux membres STOA.' });
});

test('les raccourcis sensibles et la navigation au curseur sont bloqués', async ({ page }, testInfo) => {
  test.skip(['javascript-disabled', 'canvas-chromium'].includes(testInfo.project.name));
  const blocked = await page.locator('#protected-text').evaluate((element) => {
    const dispatch = (key, options = {}) => !element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }));
    return {
      copy: dispatch('c', { ctrlKey: true }),
      save: dispatch('s', { ctrlKey: true }),
      print: dispatch('p', { ctrlKey: true }),
      source: dispatch('u', { ctrlKey: true }),
      devtools: dispatch('i', { ctrlKey: true, shiftKey: true }),
      f12: dispatch('F12'),
      caret: dispatch('F7'),
    };
  });
  expect(Object.values(blocked).every(Boolean)).toBe(true);
});

test('les champs explicitement autorisés restent utilisables', async ({ page }, testInfo) => {
  test.skip(['javascript-disabled', 'canvas-chromium'].includes(testInfo.project.name));
  const input = page.locator('#allowed-input');
  await input.fill('Texte modifiable');
  await input.selectText();
  await expect(input).toHaveValue('Texte modifiable');
});

test('les images sont non déplaçables et l’impression masque la leçon', async ({ page }, testInfo) => {
  test.skip(['javascript-disabled', 'canvas-chromium'].includes(testInfo.project.name));
  await expect(page.locator('#protected-image')).toHaveAttribute('draggable', 'false');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#lesson-content')).toBeHidden();
});

test('la perte de focus masque immédiatement le contenu', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'javascript-disabled');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#lesson-content')).toHaveClass(/stoa-security-obscured/);
});

test('le mode canvas retire le texte du DOM', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canvas-chromium');
  const canvas = page.locator('#lesson-copy canvas');
  await expect(canvas).toBeVisible();
  await expect(page.locator('#lesson-copy')).not.toContainText('Texte pédagogique confidentiel');
  const blocked = await canvas.evaluate((element) => ({
    context: !element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
    selection: !element.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true })),
    copy: !element.dispatchEvent(new Event('copy', { bubbles: true, cancelable: true })),
  }));
  expect(blocked).toEqual({ context: true, selection: true, copy: true });
});
