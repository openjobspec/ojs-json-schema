# @openjobspec/schemas

[![CI](https://github.com/openjobspec/ojs-json-schema/actions/workflows/ci.yml/badge.svg)](https://github.com/openjobspec/ojs-json-schema/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@openjobspec/schemas.svg)](https://www.npmjs.com/package/@openjobspec/schemas)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

JSON Schema definitions for the [Open Job Spec (OJS)](https://openjobspec.org) v1.0.0-rc.1.

This package provides machine-readable [JSON Schema (draft 2020-12)](https://json-schema.org/draft/2020-12/schema) definitions for all OJS data structures, enabling validation, code generation, and editor support across any programming language.

## Installation

```bash
npm install @openjobspec/schemas
```

## Schemas

### Core Schemas (`schemas/v1/`)

| Schema | Description |
|--------|-------------|
| [`job.schema.json`](schemas/v1/job.schema.json) | Job envelope -- the core data structure |
| [`job-options.schema.json`](schemas/v1/job-options.schema.json) | Enqueue options (queue, priority, timeout, retry, etc.) |
| [`retry-policy.schema.json`](schemas/v1/retry-policy.schema.json) | Retry policy (backoff, jitter, non-retryable errors) |
| [`unique-policy.schema.json`](schemas/v1/unique-policy.schema.json) | Unique job / deduplication policy |
| [`error.schema.json`](schemas/v1/error.schema.json) | Structured error (type, message, backtrace) |
| [`event.schema.json`](schemas/v1/event.schema.json) | Lifecycle event envelope |
| [`workflow.schema.json`](schemas/v1/workflow.schema.json) | Workflow definition (chain, group, batch) |
| [`cron.schema.json`](schemas/v1/cron.schema.json) | Cron job registration |
| [`queue-stats.schema.json`](schemas/v1/queue-stats.schema.json) | Queue statistics |
| [`worker-info.schema.json`](schemas/v1/worker-info.schema.json) | Worker registration / heartbeat |
| [`manifest.schema.json`](schemas/v1/manifest.schema.json) | Conformance manifest |

### HTTP Binding Schemas (`schemas/v1/http/`)

| Schema | Description |
|--------|-------------|
| [`enqueue-request.schema.json`](schemas/v1/http/enqueue-request.schema.json) | `POST /ojs/v1/jobs` request |
| [`enqueue-response.schema.json`](schemas/v1/http/enqueue-response.schema.json) | `POST /ojs/v1/jobs` response |
| [`batch-enqueue-request.schema.json`](schemas/v1/http/batch-enqueue-request.schema.json) | `POST /ojs/v1/jobs/batch` request |
| [`batch-enqueue-response.schema.json`](schemas/v1/http/batch-enqueue-response.schema.json) | `POST /ojs/v1/jobs/batch` response |
| [`fetch-request.schema.json`](schemas/v1/http/fetch-request.schema.json) | `POST /ojs/v1/workers/fetch` request |
| [`fetch-response.schema.json`](schemas/v1/http/fetch-response.schema.json) | `POST /ojs/v1/workers/fetch` response |
| [`ack-request.schema.json`](schemas/v1/http/ack-request.schema.json) | `POST /ojs/v1/workers/ack` request |
| [`nack-request.schema.json`](schemas/v1/http/nack-request.schema.json) | `POST /ojs/v1/workers/nack` request |
| [`heartbeat-request.schema.json`](schemas/v1/http/heartbeat-request.schema.json) | `POST /ojs/v1/workers/heartbeat` request |
| [`heartbeat-response.schema.json`](schemas/v1/http/heartbeat-response.schema.json) | `POST /ojs/v1/workers/heartbeat` response |

## Usage

### Node.js with Ajv

```javascript
import Ajv from "ajv";
import addFormats from "ajv-formats";
import jobSchema from "@openjobspec/schemas/job";
import retrySchema from "@openjobspec/schemas/retry-policy";
import uniqueSchema from "@openjobspec/schemas/unique-policy";
import errorSchema from "@openjobspec/schemas/error";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Register referenced schemas
ajv.addSchema(retrySchema);
ajv.addSchema(uniqueSchema);
ajv.addSchema(errorSchema);

const validate = ajv.compile(jobSchema);

const job = {
  specversion: "1.0.0-rc.1",
  id: "019461a8-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  type: "email.send",
  queue: "default",
  args: ["user@example.com", "welcome"],
};

if (validate(job)) {
  console.log("Valid OJS job envelope");
} else {
  console.error("Validation errors:", validate.errors);
}
```

### Direct Schema Reference

All schemas use `$id` URIs that can be resolved directly:

```
https://openjobspec.org/schemas/v1/job.json
https://openjobspec.org/schemas/v1/retry-policy.json
https://openjobspec.org/schemas/v1/unique-policy.json
https://openjobspec.org/schemas/v1/error.json
```

### Python with jsonschema

```python
import json
from jsonschema import validate, Draft202012Validator

with open("node_modules/@openjobspec/schemas/schemas/v1/job.schema.json") as f:
    schema = json.load(f)

job = {
    "specversion": "1.0.0-rc.1",
    "id": "019461a8-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
    "type": "email.send",
    "queue": "default",
    "args": ["user@example.com", "welcome"],
}

validate(instance=job, schema=schema, cls=Draft202012Validator)
```

## Test Fixtures

The `tests/` directory contains test fixtures for validating schema implementations:

- **`tests/valid/`** -- 13 valid job documents covering edge cases (minimal, full, scheduled, retryable, discarded, pending, cancelled, etc.)
- **`tests/invalid/`** -- 16 invalid documents with `_reason` fields explaining why each MUST be rejected

These fixtures can be used by any OJS implementation to verify schema conformance.

## Schema Design

- **JSON Schema draft 2020-12** -- Uses the latest stable draft
- **`$ref` for composition** -- Retry policy, unique policy, error, and job options are separate schemas referenced via `$ref`
- **`additionalProperties: true`** on the job envelope -- Unknown attributes MUST be preserved for forward compatibility
- **`additionalProperties: false`** on sub-schemas (error, retry, unique, options) -- Strict validation where the spec does not allow extension
- **`const` for specversion** -- Ensures exact version matching
- **`pattern` for identifiers** -- UUIDv7, job types, and queue names are validated via regex

## Spec Conformance

These schemas conform to the [OJS Core Specification v1.0.0-rc.1](https://openjobspec.org/spec/v1/ojs-core) and the [OJS HTTP Binding v1.0.0-rc.1](https://openjobspec.org/spec/v1/ojs-http-binding).

## License

[Apache 2.0](LICENSE)
