const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const nock = require('nock');
const downloadPage = require('../src/index.cjs');

let tempDir;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
  nock.cleanAll();
});

describe('page-loader', () => {
  const baseUrl = 'https://ru.hexlet.io';
  const pageUrl = `${baseUrl}/courses`;

  test('should download page and change html', async () => {
    const inputHtml = await fs.readFile(path.join(__dirname, '..', '__fixtures__', 'page.html'), 'utf-8');
    const image = await fs.readFile(path.join(__dirname, '..', '__fixtures__', 'nodejs.png'));

    nock(baseUrl)
      .get('/courses')
      .reply(200, inputHtml)
      .get('/assets/professions/nodejs.png')
      .reply(200, image)
      .get('/assets/application.css')
      .reply(200, 'body {}')
      .get('/courses')
      .reply(200, inputHtml)
      .get('/packs/js/runtime.js')
      .reply(200, 'console.log("runtime")');

    const filePath = await downloadPage(pageUrl, tempDir);

    const savedHtml = await fs.readFile(filePath, 'utf-8');
    expect(savedHtml).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png');
    expect(savedHtml).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css');
    expect(savedHtml).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-packs-js-runtime.js');
    expect(savedHtml).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-courses.html');
    expect(savedHtml).toContain('https://cdn2.hexlet.io/assets/menu.css');
    expect(savedHtml).toContain('https://js.stripe.com/v3/');

    const resourcesDir = path.join(tempDir, 'ru-hexlet-io-courses_files');
    const files = await fs.readdir(resourcesDir);
    expect(files).toContain('ru-hexlet-io-assets-professions-nodejs.png');
    expect(files).toContain('ru-hexlet-io-assets-application.css');
    expect(files).toContain('ru-hexlet-io-packs-js-runtime.js');
    expect(files).toContain('ru-hexlet-io-courses.html');
  });

  test('should handle network error', async () => {
    nock(baseUrl)
      .get('/courses')
      .replyWithError('Network Error');

    await expect(downloadPage(pageUrl, tempDir)).rejects.toThrow('Network Error');
  });

  test('should handle 404 error', async () => {
    nock(baseUrl)
      .get('/courses')
      .reply(404);

    await expect(downloadPage(pageUrl, tempDir)).rejects.toThrow('Request failed with status code 404');
  });

  test('should handle missing output directory', async () => {
    const fakeDir = path.join(tempDir, 'nonexistent');
    nock(baseUrl)
      .get('/courses')
      .reply(200, '<html></html>');

    await expect(downloadPage(pageUrl, fakeDir)).rejects.toThrow();
  });
});