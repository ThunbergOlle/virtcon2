#!/usr/bin/env node

import { program } from 'commander';
import * as path from 'path';
import { parseYamlFile } from './lib/parser/yaml-parser';
import { renderSprite } from './lib/renderer/canvas-renderer';
import { writePng, getPngBuffer } from './lib/output/png-writer';
import { pngToYaml, writeYamlFile, spriteToYamlString, compareImages, extractPixels } from './lib/extractor/png-to-yaml';

program.name('sprite-gen').description('Convert YAML sprite definitions into PNG pixel art images').version('0.0.1');

// Generate command (default)
program
  .command('generate', { isDefault: true })
  .description('Generate PNG from YAML sprite definition')
  .argument('<input>', 'Input YAML file')
  .option('-o, --output <path>', 'Output PNG file path')
  .option('--stdout', 'Output PNG to stdout instead of file')
  .action((input: string, options: { output?: string; stdout?: boolean }) => {
    try {
      const inputPath = path.resolve(input);

      // Parse YAML
      const definition = parseYamlFile(inputPath);

      // Render sprite
      const canvas = renderSprite(definition);

      // Output
      if (options.stdout) {
        const buffer = getPngBuffer(canvas);
        process.stdout.write(buffer);
      } else {
        const outputPath = options.output ? path.resolve(options.output) : inputPath.replace(/\.ya?ml$/i, '.png');

        writePng(canvas, outputPath);
        console.log(`Generated: ${outputPath}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Extract command - convert PNG to YAML
program
  .command('extract')
  .description('Extract YAML sprite definition from PNG image')
  .argument('<input>', 'Input PNG file')
  .option('-o, --output <path>', 'Output YAML file path')
  .option('-n, --name <name>', 'Sprite name (defaults to filename)')
  .option('--stdout', 'Output YAML to stdout instead of file')
  .action(async (input: string, options: { output?: string; name?: string; stdout?: boolean }) => {
    try {
      const inputPath = path.resolve(input);

      // Extract sprite from PNG
      const sprite = await pngToYaml(inputPath, options.name);

      if (options.stdout) {
        console.log(spriteToYamlString(sprite));
      } else {
        const outputPath = options.output ? path.resolve(options.output) : inputPath.replace(/\.png$/i, '.yaml');

        await writeYamlFile(sprite, outputPath);
        console.log(`Extracted: ${outputPath}`);
        console.log(`  - Canvas: ${sprite.meta.canvas[0]}x${sprite.meta.canvas[1]}`);
        console.log(`  - Colors: ${Object.keys(sprite.palette).length}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Compare command - compare two PNG images pixel by pixel
program
  .command('compare')
  .description('Compare two PNG images pixel by pixel')
  .argument('<image1>', 'First PNG image (original)')
  .argument('<image2>', 'Second PNG image (generated)')
  .option('--json', 'Output result as JSON')
  .action(async (image1: string, image2: string, options: { json?: boolean }) => {
    try {
      const path1 = path.resolve(image1);
      const path2 = path.resolve(image2);

      const result = await compareImages(path1, path2);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.match) {
          console.log('✓ PERFECT MATCH!');
          process.exit(0);
        } else {
          console.log(`✗ Found ${result.differences.length} differences:`);
          for (const diff of result.differences.slice(0, 20)) {
            if (diff.x === -1) {
              console.log(`  Size mismatch: ${diff.original.hex} vs ${diff.generated.hex}`);
            } else {
              console.log(
                `  (${diff.x},${diff.y}): ${diff.original.hex} a=${diff.original.alpha} vs ${diff.generated.hex} a=${diff.generated.alpha}`
              );
            }
          }
          if (result.differences.length > 20) {
            console.log(`  ... and ${result.differences.length - 20} more`);
          }
          process.exit(1);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Pixels command - dump pixel data from PNG
program
  .command('pixels')
  .description('Extract and display pixel data from PNG image')
  .argument('<input>', 'Input PNG file')
  .option('--json', 'Output as JSON')
  .action(async (input: string, options: { json?: boolean }) => {
    try {
      const inputPath = path.resolve(input);
      const { width, height, pixels } = await extractPixels(inputPath);

      if (options.json) {
        console.log(JSON.stringify({ width, height, pixels }, null, 2));
      } else {
        console.log(`Size: ${width} x ${height}`);
        console.log(`Non-transparent pixels: ${pixels.length}`);
        console.log();
        for (const p of pixels) {
          console.log(`(${p.x},${p.y}): ${p.hex} alpha=${p.alpha}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

// Roundtrip command - extract YAML, regenerate PNG, compare
program
  .command('roundtrip')
  .description('Extract YAML from PNG, regenerate, and verify match')
  .argument('<input>', 'Input PNG file')
  .option('-o, --output-dir <dir>', 'Output directory for generated files')
  .option('--keep', 'Keep intermediate files even on success')
  .action(async (input: string, options: { outputDir?: string; keep?: boolean }) => {
    try {
      const inputPath = path.resolve(input);
      const baseName = path.basename(inputPath, '.png');
      const outputDir = options.outputDir ? path.resolve(options.outputDir) : path.dirname(inputPath);

      const yamlPath = path.join(outputDir, `${baseName}.yaml`);
      const regeneratedPath = path.join(outputDir, `${baseName}_regenerated.png`);

      // Step 1: Extract YAML
      console.log(`1. Extracting YAML from ${inputPath}...`);
      const sprite = await pngToYaml(inputPath);
      await writeYamlFile(sprite, yamlPath);
      console.log(`   Created: ${yamlPath}`);

      // Step 2: Regenerate PNG
      console.log(`2. Regenerating PNG from YAML...`);
      const definition = parseYamlFile(yamlPath);
      const canvas = renderSprite(definition);
      writePng(canvas, regeneratedPath);
      console.log(`   Created: ${regeneratedPath}`);

      // Step 3: Compare
      console.log(`3. Comparing images...`);
      const result = await compareImages(inputPath, regeneratedPath);

      if (result.match) {
        console.log(`\n✓ ROUNDTRIP SUCCESS! Images are identical.`);

        // Clean up if not keeping files
        if (!options.keep) {
          const fs = await import('fs');
          fs.unlinkSync(regeneratedPath);
          console.log(`   Cleaned up: ${regeneratedPath}`);
        }
      } else {
        console.log(`\n✗ ROUNDTRIP FAILED! Found ${result.differences.length} differences.`);
        for (const diff of result.differences.slice(0, 10)) {
          console.log(
            `  (${diff.x},${diff.y}): orig=${diff.original.hex} a=${diff.original.alpha} vs gen=${diff.generated.hex} a=${diff.generated.alpha}`
          );
        }
        process.exit(1);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

program.parse();
