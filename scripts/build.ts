import { readdir, rm } from "node:fs/promises"
import { existsSync, mkdirSync } from "node:fs"

const buildDir = "./build"
const srcDir = "./src"
const assetsDir = "./assets"

console.log("Start build script\n")

if (!existsSync(buildDir)) {
    console.log(`Creating ${buildDir} folder...`)
    mkdirSync(buildDir)
    console.log(`Done creating ${buildDir} folder\n`)
}

console.log(`Cleaning ${buildDir} folder...`)
await rm(buildDir, { recursive: true, force: true })
console.log(`Done cleaning ${buildDir} folder\n`)

console.log(`Building ${srcDir} folder...`)
await Bun.build({
    entrypoints: [`${srcDir}/index.ts`],
    outdir: buildDir,
    minify: true,
})
console.log(`Done building ${srcDir} folder\n`)

console.log(`Copying ${assetsDir} folder...`)
const assetsFiles = await readdir(assetsDir, { recursive: true })
for (const fileName of assetsFiles) {
    console.log("Copying", fileName)
    const file = Bun.file(`${assetsDir}/${fileName}`)
    await Bun.write(`${buildDir}/assets/${fileName}`, file)
}
console.log(`Done copying ${assetsDir} folder\n`)

console.log(`Copying html...`)
const file = Bun.file(`./index.html`)
await Bun.write(`${buildDir}/index.html`, file)
console.log(`Done copying html\n`)

console.log("End build script")
