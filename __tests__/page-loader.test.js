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
  const baseUrl = 'http://example.com';
  const pageUrl = `${baseUrl}/test-page`;

  test('should download page', async () => {
    const html = '<html><body>Test</body></html>';
    const expectedHtml = '<html><head></head><body>Test</body></html>';

    nock(baseUrl)
      .get('/test-page')
      .reply(200, html);

    const filePath = await downloadPage(pageUrl, tempDir);
    const fileName = path.basename(filePath);
    expect(fileName).toBe('example-com-test-page.html');

    const savedHtml = await fs.readFile(filePath, 'utf-8');
    expect(savedHtml).toBe(expectedHtml);
  });

  test('should handle network error', async () => {
    nock(baseUrl)
      .get('/test-page')
      .replyWithError('Network Error');

    await expect(downloadPage(pageUrl, tempDir)).rejects.toThrow('Network Error');
  });

  test('should handle 404 error', async () => {
    nock(baseUrl)
      .get('/test-page')
      .reply(404);

    await expect(downloadPage(pageUrl, tempDir)).rejects.toThrow('Request failed with status code 404');
  });
});
