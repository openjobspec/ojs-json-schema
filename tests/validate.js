import { runValidation } from './schema-harness.js';

try {
  process.exitCode = runValidation();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

