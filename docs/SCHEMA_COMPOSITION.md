# OJS Schema Composition Guide

## Overview

The OJS JSON Schema suite uses **JSON Schema draft 2020-12** with `$ref`-based composition to keep schemas modular and reusable. This guide explains how the schemas fit together, how to extend them for custom use cases, and how to maintain forward compatibility.

## How OJS Schemas Are Composed

### Schema ID Namespace

All OJS schemas live under the `https://openjobspec.org/schemas/` namespace:

```
https://openjobspec.org/schemas/v1/job.json              # Core job envelope
https://openjobspec.org/schemas/v1/retry-policy.json      # Retry policy
https://openjobspec.org/schemas/v1/unique-policy.json     # Uniqueness policy
https://openjobspec.org/schemas/v1/error.json             # Structured error
https://openjobspec.org/schemas/v1/job-options.json       # Enqueue options
https://openjobspec.org/schemas/v1/http/enqueue-request.json  # HTTP binding
```

### Reference (`$ref`) Patterns

OJS schemas use `$ref` to compose sub-schemas. This avoids duplication and ensures consistency:

```json
{
  "retry": {
    "$ref": "https://openjobspec.org/schemas/v1/retry-policy.json"
  }
}
```

The reference chain in OJS:

```
job.schema.json
├── $ref: retry-policy.json     (retry field)
├── $ref: unique-policy.json    (unique field)
└── $ref: error.json            (error field)

job-options.schema.json
├── $ref: retry-policy.json     (retry field)
└── $ref: unique-policy.json    (unique field)

workflow.schema.json
└── $ref: job-options.json      (options field)

cron.schema.json
└── $ref: job-options.json      (options field)

http/enqueue-request.schema.json
└── $ref: job-options.json      (options field)

http/batch-enqueue-request.schema.json
└── $ref: enqueue-request.json  (jobs[] items)

workflow-builder.schema.json
└── $ref: workflow.schema.json  (workflow field)

migration-export.schema.json
├── $ref: retry-policy.schema.json
└── $ref: unique-policy.schema.json
```

### Internal References (`$defs`)

Some schemas define reusable sub-schemas with `$defs`:

```json
{
  "$defs": {
    "workflow_step": {
      "type": "object",
      "required": ["type", "args"],
      "properties": { ... }
    }
  },
  "properties": {
    "steps": {
      "items": { "$ref": "#/$defs/workflow_step" }
    }
  }
}
```

Schemas using `$defs`: `workflow.schema.json`, `manifest.schema.json`, `affinity.schema.json`, `ml-resources.schema.json`, `webhook.schema.json`, `federation.schema.json`, `workflow-builder.schema.json`.

---

## Extending OJS Schemas

### Strategy 1: Using `additionalProperties: true` (Job Envelope)

The core `job.schema.json` has `additionalProperties: true`, which means you can add custom fields directly to the job envelope without modifying the schema:

```json
{
  "specversion": "1.0",
  "id": "019461a8-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "type": "ml.training.finetune",
  "queue": "gpu-training",
  "args": ["llama-3.1-8b", "customer-support-dataset"],
  "ext_ml_gpu_type": "nvidia-a100",
  "ext_ml_gpu_count": 4,
  "ext_ml_precision": "bf16"
}
```

**Convention:** Custom extension fields MUST use the `ext_` prefix to avoid collisions with future OJS attributes.

### Strategy 2: Composing with `allOf`

To validate a job envelope against both the OJS core schema and your custom extension schema, use `allOf`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/ml-training-job.json",
  "title": "ML Training Job",
  "description": "Job envelope with ML training extensions",
  "allOf": [
    { "$ref": "https://openjobspec.org/schemas/v1/job.json" },
    { "$ref": "#/$defs/ml_training_extensions" }
  ],
  "$defs": {
    "ml_training_extensions": {
      "type": "object",
      "properties": {
        "ext_ml_gpu_type": {
          "type": "string",
          "enum": ["nvidia-a100", "nvidia-h100", "nvidia-h200"]
        },
        "ext_ml_gpu_count": {
          "type": "integer",
          "minimum": 1,
          "maximum": 8
        },
        "ext_ml_precision": {
          "type": "string",
          "enum": ["fp32", "fp16", "bf16", "fp8"]
        },
        "ext_ml_dataset_uri": {
          "type": "string",
          "format": "uri"
        }
      },
      "required": ["ext_ml_gpu_type", "ext_ml_gpu_count"]
    }
  }
}
```

### Strategy 3: Extending `meta` for Cross-Cutting Concerns

The `meta` field on the job envelope is designed for cross-cutting concerns. Use it for tracing, tenancy, and custom routing:

```json
{
  "specversion": "1.0",
  "id": "019461a8-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "type": "email.send",
  "queue": "default",
  "args": ["user@example.com", "welcome"],
  "meta": {
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "tenant_id": "tenant_acme",
    "custom_routing_key": "us-east-1",
    "correlation_id": "order-12345"
  }
}
```

Unlike `ext_*` fields on the envelope, `meta` keys have no naming convention requirement. However, implementations MUST preserve all `meta` keys without modification.

---

## Example: Custom ML Training Job Extension Schema

Here is a complete custom extension schema for ML training jobs:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/v1/ml-training-job.json",
  "title": "ML Training Job Extension",
  "description": "Custom OJS extension for ML model training jobs. Validates both the OJS core envelope and ML-specific requirements.",
  "allOf": [
    { "$ref": "https://openjobspec.org/schemas/v1/job.json" },
    {
      "type": "object",
      "required": ["ext_ml_model_name", "ext_ml_framework"],
      "properties": {
        "ext_ml_model_name": {
          "type": "string",
          "description": "Model identifier (e.g., 'llama-3.1-70b').",
          "minLength": 1,
          "maxLength": 256
        },
        "ext_ml_model_version": {
          "type": "string",
          "description": "Semantic version of the model.",
          "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+(-[a-zA-Z0-9.]+)?$"
        },
        "ext_ml_framework": {
          "type": "string",
          "enum": ["pytorch", "tensorflow", "jax"],
          "description": "ML framework for training."
        },
        "ext_ml_gpu_type": {
          "type": "string",
          "description": "GPU hardware type.",
          "enum": ["nvidia-a100", "nvidia-h100", "nvidia-h200"]
        },
        "ext_ml_gpu_count": {
          "type": "integer",
          "minimum": 1,
          "maximum": 128,
          "default": 1
        },
        "ext_ml_precision": {
          "type": "string",
          "enum": ["fp32", "fp16", "bf16", "fp8", "int8"]
        },
        "ext_ml_dataset_uri": {
          "type": "string",
          "format": "uri",
          "description": "URI of the training dataset (s3://, gs://)."
        },
        "ext_ml_checkpoint_uri": {
          "type": "string",
          "format": "uri",
          "description": "URI for saving training checkpoints."
        },
        "ext_ml_epochs": {
          "type": "integer",
          "minimum": 1,
          "description": "Number of training epochs."
        },
        "ext_ml_hyperparameters": {
          "type": "object",
          "description": "Training hyperparameters.",
          "properties": {
            "learning_rate": { "type": "number", "exclusiveMinimum": 0 },
            "batch_size": { "type": "integer", "minimum": 1 },
            "warmup_steps": { "type": "integer", "minimum": 0 },
            "weight_decay": { "type": "number", "minimum": 0 }
          },
          "additionalProperties": true
        }
      }
    }
  ],
  "examples": [
    {
      "specversion": "1.0",
      "id": "019461a8-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "type": "ml.training.finetune",
      "queue": "gpu-training",
      "args": ["customer-support-v2"],
      "meta": {
        "experiment_id": "exp_001",
        "team": "ml-platform"
      },
      "ext_ml_model_name": "llama-3.1-8b",
      "ext_ml_model_version": "1.0.0",
      "ext_ml_framework": "pytorch",
      "ext_ml_gpu_type": "nvidia-a100",
      "ext_ml_gpu_count": 4,
      "ext_ml_precision": "bf16",
      "ext_ml_dataset_uri": "s3://datasets/customer-support-v2/",
      "ext_ml_checkpoint_uri": "s3://checkpoints/finetune-001/",
      "ext_ml_epochs": 3,
      "ext_ml_hyperparameters": {
        "learning_rate": 2e-5,
        "batch_size": 32,
        "warmup_steps": 100,
        "weight_decay": 0.01
      },
      "retry": {
        "max_attempts": 3,
        "initial_interval": "PT30S",
        "backoff_coefficient": 2.0,
        "on_exhaustion": "dead_letter"
      }
    }
  ]
}
```

### Using the Extension Schema

**Node.js (Ajv):**

```javascript
import Ajv from "ajv";
import addFormats from "ajv-formats";
import jobSchema from "@openjobspec/schemas/job";
import retrySchema from "@openjobspec/schemas/retry-policy";
import uniqueSchema from "@openjobspec/schemas/unique-policy";
import errorSchema from "@openjobspec/schemas/error";
import mlTrainingSchema from "./ml-training-job.schema.json";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Register OJS base schemas
ajv.addSchema(jobSchema);
ajv.addSchema(retrySchema);
ajv.addSchema(uniqueSchema);
ajv.addSchema(errorSchema);

// Compile the extended schema
const validate = ajv.compile(mlTrainingSchema);
```

**Python (jsonschema):**

```python
import json
from jsonschema import validate, Draft202012Validator, RefResolver

# Load schemas
with open("schemas/v1/job.schema.json") as f:
    job_schema = json.load(f)
with open("ml-training-job.schema.json") as f:
    ml_schema = json.load(f)

# Create a resolver that knows about OJS schemas
store = {
    job_schema["$id"]: job_schema,
    # ... add other referenced schemas
}
resolver = RefResolver.from_schema(ml_schema, store=store)

validate(instance=job, schema=ml_schema, resolver=resolver,
         cls=Draft202012Validator)
```

---

## Versioning Strategy

### Namespace Versioning

OJS schemas use directory-based versioning:

```
schemas/v1/job.schema.json          # Version 1.x
schemas/v1/retry-policy.schema.json # Version 1.x
schemas/v2/job.schema.json          # Future version 2.x (breaking changes)
```

The `v1/` namespace corresponds to OJS specification version `1.0`. All schemas within `v1/` are governed by the same backwards-compatibility guarantees.

### Compatibility Rules

Within a major version (`v1/`):

1. **New optional fields MAY be added** — existing validators will ignore them (schemas with `additionalProperties: true`) or reject them (schemas with `additionalProperties: false`).

2. **Required fields MUST NOT be added** — this would break existing producers.

3. **Enum values MAY be added** — new event types, states, or error codes can appear. Consumers SHOULD handle unknown values gracefully.

4. **Patterns MUST NOT become more restrictive** — existing valid values must remain valid.

5. **Fields MUST NOT be removed or renamed** — this would break existing consumers.

### How `additionalProperties` Affects Extensibility

| `additionalProperties` | Extensibility | Used By |
|------------------------|---------------|---------|
| `true` | ✅ Forward-compatible. Unknown fields are preserved. New fields can be added by producers without schema changes. | `job`, `event`, `workflow`, `worker-info`, `manifest` |
| `false` | ❌ Strict. Unknown fields are rejected. Schema must be updated to add new fields. | `job-options`, `retry-policy`, `unique-policy`, `error`, `api-error`, `cron`, all HTTP bindings |

This is intentional:
- The **job envelope** is extensible because it must support custom `ext_*` fields across implementations.
- **Sub-schemas** (retry policy, error, options) are strict because they have well-defined semantics and unexpected fields could indicate bugs.

---

## Best Practices

### DO

- ✅ Use `ext_` prefix for custom fields on the job envelope
- ✅ Use `allOf` to compose OJS schemas with extension schemas
- ✅ Register all referenced schemas with your validator before compiling
- ✅ Use the `meta` field for cross-cutting concerns (tracing, tenancy)
- ✅ Test your extensions against the OJS test fixtures in `tests/valid/` and `tests/invalid/`
- ✅ Follow the same JSON Schema draft (2020-12) for extension schemas

### DON'T

- ❌ Modify OJS schemas directly — compose or extend instead
- ❌ Add required fields to `additionalProperties: false` schemas without a spec RFC
- ❌ Use field names that could collide with future OJS attributes (use `ext_` prefix)
- ❌ Assume consumers will preserve `additionalProperties: false` schemas — they won't
- ❌ Mix JSON Schema drafts (e.g., draft-07 with 2020-12) in the same validation pipeline

---

## Schema Resolution

When using `$ref` across schemas, validators need to resolve references. Here's how to set up schema resolution:

### Local File Resolution

For local development, map `$id` URIs to local files:

```javascript
// Ajv (Node.js)
const ajv = new Ajv();
addFormats(ajv);

// Add all schemas - Ajv resolves $ref via $id
ajv.addSchema(require("./schemas/v1/job.schema.json"));
ajv.addSchema(require("./schemas/v1/retry-policy.schema.json"));
ajv.addSchema(require("./schemas/v1/unique-policy.schema.json"));
ajv.addSchema(require("./schemas/v1/error.schema.json"));
ajv.addSchema(require("./schemas/v1/job-options.schema.json"));
```

### HTTP Resolution

In production, schemas can be fetched from `https://openjobspec.org/schemas/v1/`:

```python
from jsonschema import RefResolver

resolver = RefResolver(
    base_uri="https://openjobspec.org/schemas/v1/",
    referrer=schema,
    handlers={"https": url_handler}
)
```

### npm Package Resolution

When installed via `npm install @openjobspec/schemas`, schemas are available as:

```javascript
import jobSchema from "@openjobspec/schemas/job";
import retrySchema from "@openjobspec/schemas/retry-policy";
// etc.
```
