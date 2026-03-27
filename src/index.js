const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const debug = require('debug');
const Listr = require('listr');

const log = debug('page-loader');

const getFileName = (url) => {
  const urlObj = new URL(url);
  const name = `${urlObj.hostname}${urlObj.pathname}`.replace(/[^\w]/g, '-');
  // Убираем лишние дефисы в конце
  return `${name.replace(/-+$/, '')}.html`;
};

const getResourceName = (url, baseUrl) => {
  const fullUrl = new URL(url, baseUrl).toString();
  const { hostname, pathname } = new URL(fullUrl);
  let name = `${hostname}${pathname}`.replace(/[^\w]/g, '-');
  // Убираем лишние дефисы в конце
  name = name.replace(/-+$/, '');
  
  // Добавляем расширение из URL
  const extension = path.extname(pathname);
  if (extension) {
    return name;
  }
  return name;
};

const getResourcesDir = (url) => {
  const fileName = getFileName(url);
  return fileName.replace('.html', '_files');
};

const isLocal = (url, baseUrl) => {
  try {
    const { hostname: linkHost } = new URL(url, baseUrl);
    const { hostname: baseHost } = new URL(baseUrl);
    return linkHost === baseHost;
  } catch {
    return false;
  }
};

const downloadResource = async (url, outputDir, baseUrl) => {
  const fullUrl = new URL(url, baseUrl).toString();
  const resourceName = getResourceName(url, baseUrl);
  const filePath = path.join(outputDir, resourceName);

  log(`Downloading: ${fullUrl}`);
  const response = await axios({
    method: 'get',
    url: fullUrl,
    responseType: 'arraybuffer',
  });

  await fs.writeFile(filePath, response.data);
  log(`Saved: ${filePath}`);
  return filePath;
};

const processHtml = async (html, baseUrl, resourcesDir) => {
  const $ = cheerio.load(html);
  const tags = {
    img: 'src',
    link: 'href',
    script: 'src',
  };
  const resources = [];

  Object.entries(tags).forEach(([tag, attr]) => {
    $(tag).each((i, elem) => {
      const url = $(elem).attr(attr);
      if (url && isLocal(url, baseUrl)) {
        const resourceName = getResourceName(url, baseUrl);
        const localPath = path.join(resourcesDir, resourceName);
        $(elem).attr(attr, localPath);
        resources.push({ url, fullUrl: new URL(url, baseUrl).toString() });
      }
    });
  });

  return { html: $.html(), resources };
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const downloadPage = async (url, outputDir = process.cwd()) => {
  log(`Starting download: ${url}`);
  log(`Output directory: ${outputDir}`);

  try {
    await fs.access(outputDir);
  } catch (error) {
    throw new Error(`Output directory does not exist: ${outputDir}`);
  }

  const response = await axios.get(url);
  const html = response.data;

  const fileName = getFileName(url);
  const filePath = path.join(outputDir, fileName);
  const resourcesDirName = getResourcesDir(url);
  const resourcesDir = path.join(outputDir, resourcesDirName);

  log(`Creating resources directory: ${resourcesDir}`);
  await ensureDirectoryExists(resourcesDir);

  const { html: processedHtml, resources } = await processHtml(html, url, resourcesDirName);

  const tasks = resources.map((resource) => ({
    title: `Downloading ${resource.fullUrl}`,
    task: () => downloadResource(resource.url, resourcesDir, url),
  }));

  if (tasks.length > 0) {
    const listr = new Listr(tasks, { concurrent: true });
    await listr.run();
  }

  log(`Saving HTML to: ${filePath}`);
  await fs.writeFile(filePath, processedHtml);

  log(`Page downloaded successfully: ${filePath}`);
  return filePath;
};

module.exports = downloadPage;