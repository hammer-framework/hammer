import path from 'path'

import fs from 'fs-extra'
import type { ListrTaskWrapper } from 'listr2'

/**
 * Fetches a file from the RedwoodUI repo.
 * Uses the GitHub REST API to fetch the file, rather than Octokit,
 * because Octokit both adds a bunch of overhead
 * and was causing ESM/CJS related build issues that I didn't want to deal with :)
 *
 * However, because this is not an authenticated request, it is rate-limited to 60 requests per hour: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-unauthenticated-users
 * - This is actually too low for installing all components and their stories.
 * - Two options:
 *   - Just authenticate with a PAT
 *   - Download the entire repo as a ZIP into a temp dir that will need to be cleaned up, and read from there
 *
 * @returns string, if path is to file, or array of {name: string, path: string} if path is to a directory
 */
export async function fetchFromRWUIRepo(
  path: string,
): Promise<string | { name: string; path: string }[]> {
  const owner = 'arimendelow'
  const repo = 'RedwoodUI'
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const githubToken =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.REDWOOD_GITHUB_TOKEN ||
    null

  // Perform the fetch request
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RedwoodUI Setup',
  }

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  const res = await fetch(apiUrl, {
    headers,
  })

  if (!res.ok) {
    // If we've timed out, tell users to add a PAT and give them a link to instructions
    // Check x-ratelimit-remaining header
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining')
    if (rateLimitRemaining === '0') {
      throw new Error(
        "You've hit the rate limit for unauthenticated requests to the GitHub API. To continue, you'll need to wait, or you can authenticate with a Personal Access Token (PAT) with the `public_repo` property. Create a PAT and store it under the environment variable GH_TOKEN. You can find instructions on how to do that here: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic",
      )
    } else if (res.statusText == 'Unauthorized') {
      throw new Error(
        'Request to the GitHub API was made with a token with incorrect permissions. Please check your GitHub token to make sure it has the `public_repo` property. Check under the environment variables GH_TOKEN, GITHUB_TOKEN, and REDWOOD_GITHUB_TOKEN.',
      )
    } else {
      throw new Error(`Error fetching file from repo: ${res.statusText}`)
    }
  }

  const data = await res.json()

  if (Array.isArray(data)) {
    // If data is an array, it's a list of file contents. Return an array of name/path.
    return data.map((item: any) => ({ name: item.name, path: item.path }))
  } else {
    // If data is just an object, it's a file. Decode the encoded content and return it.
    // Content comes in base64 encoded
    // Can confirm this by checking data.encoding === 'base64'
    const fileContent = Buffer.from(data.content, 'base64').toString('utf8')
    return fileContent
  }
}

/**
 * Extracts the necessary data from the TailwindCSS configuration file.
 */
export const extractTailwindConfigData = (
  configContent: string,
): {
  darkModeConfig: string | null
  colorsConfig: string | null
  pluginsConfig: string | null
} => {
  const darkModeMatch = configContent.match(/darkMode:\s*([^\n]+),/)
  const darkModeConfig = darkModeMatch ? darkModeMatch[1].trim() : null

  // Look specifically for the colors object under the theme.extend object
  const colorsMatch = configContent.match(
    /theme:\s*{\s*extend:\s*{\s*colors:\s*({[^}]+})/s,
  )
  const colorsConfig = colorsMatch ? colorsMatch[1].trim() : null

  const pluginsMatch = configContent.match(/plugins:\s*(\[.+\])/s)
  const pluginsConfig = pluginsMatch ? pluginsMatch[1].trim() : null

  return {
    darkModeConfig,
    colorsConfig,
    pluginsConfig,
  }
}

interface ImportantCSSLayers {
  base: string | null
  components: string | null
}

/**
 * Extracts the necessary data from a CSS file.
 */
export const extractCSSLayers = (cssContent: string): ImportantCSSLayers => {
  const base = extractLayerContent(cssContent, 'base')
  const components = extractLayerContent(cssContent, 'components')
  return {
    base,
    components,
  }
}

/**
 * Extracts the content of a specific layer from a CSS file.
 */
export function extractLayerContent(
  css: string,
  layerName: string,
): string | null {
  const layerRegex = new RegExp(`@layer ${layerName}\\s*{`, 'g')
  const match = layerRegex.exec(css)
  if (!match) {
    return null
  }

  const startIndex = match.index + match[0].length
  let braceCount = 1
  let endIndex = startIndex

  while (braceCount > 0 && endIndex < css.length) {
    if (css[endIndex] === '{') {
      braceCount++
    }
    if (css[endIndex] === '}') {
      braceCount--
    }
    endIndex++
  }

  const content = css.slice(startIndex, endIndex - 1).trim()
  return content
}

export function ensureDirectoryExistence(filePath: string): boolean {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  fs.mkdirSync(dirname, { recursive: true })
  return true
}

/**
 * Extracts package names from all import statements in a given file content.
 * - Note that this does not currently handle "require" statements.
 * - It also will exclude local imports (currently, those starting with "./" or "src/").
 * - Also note that this will just return the full import name, ie if you import from "pacakge/subpackage", it will return "package/subpackage".
 */
export function extractPackageImports(fileContent: string): string[] {
  // Regular expression to match import statements and capture the package name
  const importRegex = /import\s.*?from\s['"](.*?)['"]/g
  const packages = new Set<string>()
  let match

  // Iterate over all matches in the file content
  while ((match = importRegex.exec(fileContent)) !== null) {
    // Extract the package name
    const pkg = match[1]
    // Only add non-local imports
    if (!pkg.startsWith('./') && !pkg.startsWith('src/')) {
      packages.add(pkg)
    }
  }

  // Convert the set of packages to an array and return it
  return Array.from(packages)
}

/**
 * Given a TS/TSX file, adds a given import statement to the file.
 * If the file is already importing from the package, it'll just add the item being imported.
 * @returns The new file content with the import statement added.
 */
export function addImportStatementToFile(
  fileContent: string,
  packageToImportFrom: string,
  itemsToImport: string[],
): string {
  const importRegex = new RegExp(
    `import\\s*{[^}]*}\\s*from\\s*['"]${packageToImportFrom}['"]`,
    'g',
  )
  const match = importRegex.exec(fileContent)

  if (match) {
    const importMatch = match[0].match(/{([^}]*)}/)
    const existingImports = importMatch
      ? importMatch[1].split(',').map((item) => item.trim())
      : []
    const newImports = Array.from(
      new Set([...existingImports, ...itemsToImport]),
    ).join(', ')
    return fileContent.replace(
      match[0],
      `import { ${newImports} } from '${packageToImportFrom}'`,
    )
  } else {
    const importStatement = `import { ${itemsToImport.join(', ')} } from '${packageToImportFrom}'\n`
    return importStatement + fileContent
  }
}

/**
 * Checks if a TS/TSX file exists in the project (either as TS or JS).
 * Expects input file to be a TS file, as that's what RWUI is written in.
 */
export function tsFileExistInProject(filePath: string): boolean {
  // check for both TS and JS files
  return (
    fs.existsSync(filePath) || fs.existsSync(filePath.replace('.ts', '.js'))
  )
}

/**
 * Adds the given content to the task output.
 * Checks if there is existing output, and appends the new content if so.
 */
export function logTaskOutput(
  task: ListrTaskWrapper<any, any>,
  content: string,
) {
  const existingOutput = task.output ? task.output + '\n' : ''
  task.output = existingOutput + content
}
