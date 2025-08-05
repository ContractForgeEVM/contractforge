import fs from 'fs'
import path from 'path'
const ozCache = new Map<string, any>()
const CACHE_KEY = 'openzeppelin_sources'
export function getOpenZeppelinSources(): { [key: string]: { content: string } } {
  if (ozCache.has(CACHE_KEY)) {
    console.log('Using cached OpenZeppelin sources')
    return ozCache.get(CACHE_KEY)
  }
  console.log('Loading OpenZeppelin sources from filesystem...')
  const sources: { [key: string]: { content: string } } = {}
  const openZeppelinPath = path.join(__dirname, '../../node_modules/@openzeppelin/contracts')
  function readSolFiles(dirPath: string, baseDir: string = openZeppelinPath): void {
    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const fullPath = path.join(dirPath, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        readSolFiles(fullPath, baseDir)
      } else if (item.endsWith('.sol')) {
        const relativePath = path.relative(baseDir, fullPath)
        const importPath = '@openzeppelin/contracts/' + relativePath.replace(/\\/g, '/')
        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          sources[importPath] = { content }
        } catch (error) {
          console.warn(`Warning: Could not read ${fullPath}:`, error)
        }
      }
    }
  }
  try {
    if (fs.existsSync(openZeppelinPath)) {
      readSolFiles(openZeppelinPath)
      console.log(`Loaded ${Object.keys(sources).length} OpenZeppelin contract files`)
      ozCache.set(CACHE_KEY, sources)
    } else {
      console.warn('OpenZeppelin contracts not found in node_modules')
    }
  } catch (error) {
    console.error('Error loading OpenZeppelin contracts:', error)
  }
  return sources
}
export function clearOpenZeppelinCache(): void {
  ozCache.clear()
  console.log('OpenZeppelin cache cleared')
}
export function warmUpCache(): void {
  getOpenZeppelinSources()
  console.log('OpenZeppelin cache warmed up')
}