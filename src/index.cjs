const fs = require('fs/promises')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const debug = require('debug')
const Listr = require('listr')

const log = debug('page-loader')

const getFileName = (url) => {
  const urlObj = new URL(url)
  const name = `${urlObj.hostname}${urlObj.pathname}`.replace(/[^\w]/g, '-')
  return `${name.replace(/-+$/, '')}.html`
}

const getResourceName = (url, baseUrl) => {
  const fullUrl = new URL(url, baseUrl).toString()
  const { hostname, pathname } = new URL(fullUrl)
  const ext = path.extname(pathname)
  if (!ext || ext === '') {
    let name = `${hostname}${pathname}`.replace(/[^\w]/g, '-')
    name = name.replace(/-+$/, '')
    return `${name}.html`
  }
  const nameWithoutExt = pathname.slice(0, -ext.length)
  let name = `${hostname}${nameWithoutExt}`.replace(/[^\w]/g, '-')
  name = name.replace(/-+$/, '')
  return `${name}${ext}`
}

const getResourcesDir = (url) => {
  const fileName = getFileName(url)
  return fileName.replace('.html', '_files')
}

const isLocal = (url, baseUrl) => {
  try {
    const { hostname: linkHost } = new URL(url, baseUrl)
    const { hostname: baseHost } = new URL(baseUrl)
    return linkHost === baseHost
  }
  catch {
    return false
  }
}

const downloadResource = (url, outputDir, baseUrl) => {
  const fullUrl = new URL(url, baseUrl).toString()
  const resourceName = getResourceName(url, baseUrl)
  const filePath = path.join(outputDir, resourceName)
  log(`Downloading: ${fullUrl}`)
  return axios({
    method: 'get',
    url: fullUrl,
    responseType: 'arraybuffer',
  })
    .then(response => fs.writeFile(filePath, response.data))
    .then(() => {
      log(`Saved: ${filePath}`)
      return filePath
    })
}

const processHtml = (html, baseUrl, resourcesDir) => {
  const $ = cheerio.load(html)
  const tags = {
    img: 'src',
    link: 'href',
    script: 'src',
  }
  const resources = []
  Object.entries(tags).forEach(([tag, attr]) => {
    $(tag).each((i, elem) => {
      const url = $(elem).attr(attr)
      if (url && isLocal(url, baseUrl)) {
        const resourceName = getResourceName(url, baseUrl)
        const localPath = `${resourcesDir}/${resourceName}`
        $(elem).attr(attr, localPath)
        resources.push({ url, fullUrl: new URL(url, baseUrl).toString() })
      }
    })
  })
  return { html: $.html(), resources }
}

const ensureDirectoryExists = dirPath =>
  fs.access(dirPath).catch(() => fs.mkdir(dirPath, { recursive: true }))

const downloadPage = (url, outputDir = process.cwd()) => {
  log(`Starting download: ${url}`)
  log(`Output directory: ${outputDir}`)
  return fs.access(outputDir)
    .catch(() => {
      throw new Error(`Output directory does not exist: ${outputDir}`)
    })
    .then(() => axios.get(url))
    .then((response) => {
      const html = response.data
      const fileName = getFileName(url)
      const filePath = path.join(outputDir, fileName)
      const resourcesDirName = getResourcesDir(url)
      const resourcesDir = path.join(outputDir, resourcesDirName)
      log(`Creating resources directory: ${resourcesDir}`)
      return ensureDirectoryExists(resourcesDir)
        .then(() => {
          const { html: processedHtml, resources } = processHtml(html, url, resourcesDirName)
          const tasks = resources.map(resource => ({
            title: `Downloading ${resource.fullUrl}`,
            task: () => downloadResource(resource.url, resourcesDir, url),
          }))
          if (tasks.length > 0) {
            const listr = new Listr(tasks, { concurrent: true })
            return listr.run().then(() => processedHtml)
          }
          return processedHtml
        })
        .then((processedHtml) => {
          log(`Saving HTML to: ${filePath}`)
          return fs.writeFile(filePath, processedHtml)
        })
        .then(() => {
          log(`Page downloaded successfully: ${filePath}`)
          return filePath
        })
    })
}

module.exports = downloadPage
