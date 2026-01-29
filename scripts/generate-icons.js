#!/usr/bin/env node

/**
 * Generate app icons from SVG
 * Requires: sips (macOS built-in)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const buildDir = path.join(__dirname, '..', 'build')
const iconsDir = path.join(buildDir, 'icons')

// Ensure directories exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Create a simple PNG icon using Node.js canvas-like approach
// Since we don't have canvas installed, we'll create iconset manually for macOS

const iconsetDir = path.join(buildDir, 'icon.iconset')
if (!fs.existsSync(iconsetDir)) {
  fs.mkdirSync(iconsetDir, { recursive: true })
}

// Create a base 1024x1024 PNG first using a simple approach
// We'll use the built-in macOS tools

const svgPath = path.join(buildDir, 'icon.svg')
const basePngPath = path.join(buildDir, 'icon-1024.png')

// Check if we have qlmanage (macOS)
try {
  // Use qlmanage to convert SVG to PNG on macOS
  execSync(`qlmanage -t -s 1024 -o "${buildDir}" "${svgPath}" 2>/dev/null`, { stdio: 'pipe' })

  // qlmanage outputs with .png.png extension
  const generatedPng = path.join(buildDir, 'icon.svg.png')
  if (fs.existsSync(generatedPng)) {
    fs.renameSync(generatedPng, basePngPath)
    console.log('Created base icon: icon-1024.png')
  }
} catch (e) {
  // Fallback: create a simple colored PNG using base64 embedded data
  console.log('qlmanage not available, creating placeholder icon...')

  // Create a minimal valid PNG (1x1 blue pixel, will be scaled)
  // This is a workaround - in production, you'd use proper icon files
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x38, 0x68, 0xD0, 0x00,
    0x00, 0x00, 0x82, 0x00, 0x81, 0x5F, 0x5B, 0x1D, 0x3E, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ])
  fs.writeFileSync(basePngPath, minimalPng)
  console.log('Created placeholder icon')
}

// Generate different sizes for macOS iconset
const sizes = [16, 32, 64, 128, 256, 512, 1024]

if (fs.existsSync(basePngPath)) {
  for (const size of sizes) {
    const outputPath = path.join(iconsetDir, `icon_${size}x${size}.png`)
    const output2xPath = path.join(iconsetDir, `icon_${size/2}x${size/2}@2x.png`)

    try {
      execSync(`sips -z ${size} ${size} "${basePngPath}" --out "${outputPath}" 2>/dev/null`, { stdio: 'pipe' })
      console.log(`Generated: icon_${size}x${size}.png`)

      if (size >= 32) {
        fs.copyFileSync(outputPath, output2xPath)
      }
    } catch (e) {
      console.log(`Warning: Could not generate ${size}x${size} icon`)
    }
  }

  // Copy for Linux/build
  fs.copyFileSync(path.join(iconsetDir, 'icon_256x256.png'), path.join(buildDir, 'icon.png'))

  // Generate .icns for macOS
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(buildDir, 'icon.icns')}"`, { stdio: 'pipe' })
    console.log('Generated: icon.icns')
  } catch (e) {
    console.log('Warning: Could not generate .icns file')
  }
}

console.log('Icon generation complete!')
