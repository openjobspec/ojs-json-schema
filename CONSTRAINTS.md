# OJS JSON Schema Constraints Reference

## Overview

This document catalogs every validation constraint defined in the OJS JSON Schema suite (draft 2020-12). Use it as a quick-reference when implementing validators, writing tests, or building client libraries. Schemas are published at `https://openjobspec.org/schemas/v1/`.

---

## Core Schemas

### Job Envelope (`job.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/job.json`  
**Required fields:** `specversion`, `id`, `type`, `queue`, `args`  
**additionalProperties:** `true` (unknown attributes preserved for forward compatibility)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `specversion` | string | ✅ | `const: "1.0"` |
| `id` | string | ✅ | `pattern: ^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` (UUIDv7) |
| `type` | string | ✅ | `pattern: ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$`, `minLength: 1`, `maxLength: 255` |
| `queue` | string | ✅ | `pattern: ^[a-z0-9][a-z0-9\-\.]*$`, `maxLength: 128`, `default: "default"` |
| `args` | array | ✅ | `items: true` (any JSON-native element) |
| `meta` | object | ❌ | `additionalProperties: true`, `default: {}` |
| `priority` | integer | ❌ | `default: 0` |
| `timeout` | integer | ❌ | `minimum: 0` |
| `scheduled_at` | string | ❌ | `format: date-time` |
| `expires_at` | string | ❌ | `format: date-time` |
| `retry` | object | ❌ | `$ref: retry-policy.json` |
| `unique` | object | ❌ | `$ref: unique-policy.json` |
| `schema` | string | ❌ | `format: uri` |
| `state` | string | ❌ | `enum: ["scheduled", "available", "pending", "active", "completed", "retryable", "cancelled", "discarded"]` |
| `attempt` | integer | ❌ | `minimum: 0` |
| `created_at` | string | ❌ | `format: date-time` |
| `enqueued_at` | string | ❌ | `format: date-time` |
| `started_at` | string | ❌ | `format: date-time` |
| `completed_at` | string | ❌ | `format: date-time` |
| `error` | object | ❌ | `$ref: error.json` |
| `result` | any | ❌ | No type constraint |
| `errors` | array | ❌ | Array of error history objects (see sub-table) |

**`errors[]` item constraints:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | ✅ | `minLength: 1` |
| `message` | string | ✅ | `minLength: 1` |
| `type` | string | ❌ | — |
| `attempt` | integer | ✅ | `minimum: 1` |
| `occurred_at` | string | ✅ | `format: date-time` |

(`additionalProperties: true` on error history items)

---

### Job Options (`job-options.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/job-options.json`  
**Required fields:** none  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `queue` | string | ❌ | `pattern: ^[a-z0-9][a-z0-9\-\.]*$`, `maxLength: 128`, `default: "default"` |
| `priority` | integer | ❌ | `minimum: -100`, `maximum: 100`, `default: 0` |
| `timeout_ms` | integer | ❌ | `minimum: 0`, `default: 30000` |
| `delay_until` | string | ❌ | `format: date-time` |
| `expires_at` | string | ❌ | `format: date-time` |
| `retry` | object | ❌ | `$ref: retry-policy.json` |
| `unique` | object | ❌ | `$ref: unique-policy.json` |
| `tags` | array | ❌ | `items: { type: string, minLength: 1 }`, `uniqueItems: true`, `default: []` |
| `visibility_timeout_ms` | integer | ❌ | `minimum: 1000`, `default: 30000` |

---

### Retry Policy (`retry-policy.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/retry-policy.json`  
**Required fields:** none  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `max_attempts` | integer | ❌ | `minimum: 0`, `default: 3` |
| `initial_interval` | string | ❌ | `pattern: ^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$` (ISO 8601 duration), `default: "PT1S"` |
| `backoff_coefficient` | number | ❌ | `minimum: 1.0`, `default: 2.0` |
| `max_interval` | string | ❌ | ISO 8601 duration pattern (same as initial_interval), `default: "PT5M"` |
| `jitter` | boolean | ❌ | `default: true` |
| `non_retryable_errors` | array | ❌ | `items: { type: string, minLength: 1 }`, `uniqueItems: true`, `default: []` |
| `on_exhaustion` | string | ❌ | `enum: ["discard", "dead_letter"]`, `default: "discard"` |

---

### Unique Policy (`unique-policy.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/unique-policy.json`  
**Required fields:** none  
**additionalProperties:** `false`  
**Conditional:** if `keys` contains `"meta"`, then `meta_keys` is **required**.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `keys` | array | ❌ | `items: { enum: ["type", "queue", "args", "meta"] }`, `uniqueItems: true`, `default: ["type"]` |
| `args_keys` | array | ❌ | `items: { type: string, minLength: 1 }`, `uniqueItems: true` |
| `meta_keys` | array | ❌ | `items: { type: string, minLength: 1 }`, `uniqueItems: true`, `minItems: 1` |
| `period` | string | ❌ | ISO 8601 duration pattern |
| `states` | array | ❌ | `items: { enum: ["scheduled","available","pending","active","completed","retryable","cancelled","discarded"] }`, `uniqueItems: true`, `default: ["available","active","scheduled","retryable","pending"]` |
| `on_conflict` | string | ❌ | `enum: ["reject", "replace", "replace_except_schedule", "ignore"]`, `default: "reject"` |

---

### Error (`error.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/error.json`  
**Required fields:** `type`, `message`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | string | ✅ | `minLength: 1` |
| `message` | string | ✅ | `minLength: 1` |
| `backtrace` | array | ❌ | `items: { type: string }`, `maxItems: 50` |

---

### API Error (`api-error.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/api-error.json`  
**Required fields:** `code`, `message`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | ✅ | `enum:` 32 values — `"INVALID_PAYLOAD"`, `"INVALID_JOB_TYPE"`, `"INVALID_QUEUE"`, `"INVALID_ARGS"`, `"INVALID_METADATA"`, `"INVALID_STATE_TRANSITION"`, `"INVALID_RETRY_POLICY"`, `"INVALID_CRON_EXPRESSION"`, `"SCHEMA_VALIDATION_FAILED"`, `"DUPLICATE_JOB"`, `"JOB_ALREADY_COMPLETED"`, `"JOB_ALREADY_CANCELLED"`, `"UNAUTHENTICATED"`, `"PERMISSION_DENIED"`, `"TOKEN_EXPIRED"`, `"TENANT_ACCESS_DENIED"`, `"NOT_FOUND"`, `"QUEUE_PAUSED"`, `"QUEUE_FULL"`, `"RATE_LIMITED"`, `"PAYLOAD_TOO_LARGE"`, `"METADATA_TOO_LARGE"`, `"QUEUE_NAME_TOO_LONG"`, `"JOB_TYPE_TOO_LONG"`, `"CHECKSUM_MISMATCH"`, `"UNSUPPORTED_FEATURE"`, `"UNSUPPORTED_COMPRESSION"`, `"HANDLER_ERROR"`, `"HANDLER_TIMEOUT"`, `"HANDLER_PANIC"`, `"NON_RETRYABLE_ERROR"`, `"JOB_CANCELLED"`, `"BACKEND_ERROR"`, `"BACKEND_UNAVAILABLE"`, `"REPLICATION_LAG"`, `"BACKEND_TIMEOUT"` |
| `message` | string | ✅ | `minLength: 1` |
| `details` | object | ❌ | `additionalProperties: true` |
| `retryable` | boolean | ❌ | — |
| `doc_url` | string | ❌ | `format: uri` |

---

### Lifecycle Event (`event.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/event.json`  
**Required fields:** `specversion`, `id`, `type`, `source`, `time`  
**additionalProperties:** `true`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `specversion` | string | ✅ | `const: "1.0"` |
| `id` | string | ✅ | `minLength: 1` |
| `type` | string | ✅ | `enum:` 22 event types — `"job.enqueued"`, `"job.started"`, `"job.completed"`, `"job.failed"`, `"job.discarded"`, `"job.retrying"`, `"job.cancelled"`, `"job.heartbeat"`, `"job.scheduled"`, `"job.expired"`, `"job.progress"`, `"queue.paused"`, `"queue.resumed"`, `"worker.started"`, `"worker.stopped"`, `"worker.quiet"`, `"worker.heartbeat"`, `"workflow.started"`, `"workflow.step_completed"`, `"workflow.completed"`, `"workflow.failed"`, `"cron.triggered"`, `"cron.skipped"` |
| `source` | string | ✅ | `format: uri`, `minLength: 1` |
| `time` | string | ✅ | `format: date-time` |
| `subject` | string | ❌ | — |
| `datacontenttype` | string | ❌ | `default: "application/json"` |
| `data` | object | ❌ | `additionalProperties: true` |

---

### Workflow (`workflow.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/workflow.json`  
**Required fields:** `type`  
**additionalProperties:** `true`  
**Conditional (allOf):**
- if `type` = `"chain"` → `steps` is required  
- if `type` = `"group"` → `jobs` is required  
- if `type` = `"batch"` → `jobs` and `callbacks` are required

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | string | ✅ | `enum: ["chain", "group", "batch"]` |
| `id` | string | ❌ | — |
| `name` | string | ❌ | — |
| `steps` | array | Conditional | `items: $ref: #/$defs/workflow_step`, `minItems: 1` |
| `jobs` | array | Conditional | `items: $ref: #/$defs/workflow_step`, `minItems: 1` |
| `callbacks` | object | Conditional | Properties: `on_complete`, `on_success`, `on_failure` (each `$ref: workflow_step`), `additionalProperties: false`, `anyOf: [required: on_complete, required: on_success, required: on_failure]` |
| `options` | object | ❌ | `$ref: job-options.json` |
| `state` | string | ❌ | `enum: ["pending", "running", "completed", "failed", "cancelled"]` |
| `metadata` | object | ❌ | Properties: `created_at`, `started_at`, `completed_at` (all `format: date-time`), `job_count`, `completed_count`, `failed_count` (all `integer, minimum: 0`), `additionalProperties: false` |

**`workflow_step` ($defs) constraints:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | ❌ | — |
| `type` | string | ✅ | `pattern: ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$` |
| `args` | array | ✅ | `items: true` |
| `depends_on` | array | ❌ | `items: { type: string }`, `uniqueItems: true` |
| `options` | object | ❌ | `$ref: job-options.json` |
| `state` | string | ❌ | `enum: ["waiting", "pending", "available", "active", "completed", "failed", "cancelled"]` |
| `job_id` | string\|null | ❌ | — |
| `started_at` | string | ❌ | `format: date-time` |
| `completed_at` | string | ❌ | `format: date-time` |
| `result` | any | ❌ | — |

(`additionalProperties: true` on workflow steps)

---

### Cron Job (`cron.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/cron.json`  
**Required fields:** `name`, `cron`, `type`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | `pattern: ^[a-z0-9][a-z0-9\-\.]*$`, `maxLength: 255` |
| `cron` | string | ✅ | `minLength: 1` |
| `timezone` | string | ❌ | `default: "UTC"` |
| `type` | string | ✅ | `pattern: ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$`, `minLength: 1` |
| `args` | array | ❌ | `items: true`, `default: []` |
| `meta` | object | ❌ | `additionalProperties: true` |
| `options` | object | ❌ | `$ref: job-options.json` |
| `overlap_policy` | string | ❌ | `enum: ["skip", "allow", "cancel_previous", "enqueue"]`, `default: "skip"` |
| `enabled` | boolean | ❌ | `default: true` |
| `description` | string | ❌ | — |
| `status` | string | ❌ | `enum: ["active", "paused", "disabled"]` |
| `last_run_at` | string\|null | ❌ | `format: date-time` |
| `next_run_at` | string\|null | ❌ | `format: date-time` |
| `run_count` | integer | ❌ | `minimum: 0` |
| `created_at` | string | ❌ | `format: date-time` |

---

### Queue Statistics (`queue-stats.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/queue-stats.json`  
**Required fields:** `queue`, `status`, `stats`, `computed_at`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `queue` | string | ✅ | `pattern: ^[a-z0-9][a-z0-9\-\.]*$` |
| `status` | string | ✅ | `enum: ["active", "paused"]` |
| `stats` | object | ✅ | See sub-table. `additionalProperties: true` |
| `computed_at` | string | ✅ | `format: date-time` |

**`stats` sub-object:**

| Field | Type | Constraints |
|-------|------|-------------|
| `available` | integer | `minimum: 0` |
| `active` | integer | `minimum: 0` |
| `scheduled` | integer | `minimum: 0` |
| `retryable` | integer | `minimum: 0` |
| `discarded` | integer | `minimum: 0` |
| `completed_last_hour` | integer | `minimum: 0` |
| `failed_last_hour` | integer | `minimum: 0` |
| `avg_duration_ms` | number | `minimum: 0` |
| `avg_wait_ms` | number | `minimum: 0` |
| `throughput_per_second` | number | `minimum: 0` |

---

### Worker Info (`worker-info.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/worker-info.json`  
**Required fields:** `worker_id`  
**additionalProperties:** `true`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `worker_id` | string | ✅ | `minLength: 1` |
| `hostname` | string | ❌ | — |
| `pid` | integer | ❌ | `minimum: 1` |
| `queues` | array | ❌ | `items: { pattern: ^[a-z0-9][a-z0-9\-\.]*$ }`, `minItems: 1` |
| `concurrency` | integer | ❌ | `minimum: 1`, `default: 10` |
| `state` | string | ❌ | `enum: ["running", "quiet", "terminate"]` |
| `labels` | array | ❌ | `items: { type: string }`, `default: []` |
| `active_jobs` | integer | ❌ | `minimum: 0` |
| `active_job_ids` | array | ❌ | `items: { type: string }` |
| `started_at` | string | ❌ | `format: date-time` |
| `last_heartbeat_at` | string | ❌ | `format: date-time` |

---

### Conformance Manifest (`manifest.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/manifest.json`  
**Required fields:** `ojs_version`, `implementation`, `conformance_level`, `protocols`, `backend`, `capabilities`  
**additionalProperties:** `true`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `ojs_version` | string | ✅ | — |
| `implementation` | object | ✅ | Required sub-fields: `name` (minLength: 1), `version`, `language`. Optional: `homepage` (format: uri). `additionalProperties: false` |
| `conformance_level` | integer | ✅ | `minimum: 0`, `maximum: 4` |
| `conformance_tier` | string | ❌ | `enum: ["parser", "runtime", "full"]` |
| `protocols` | array | ✅ | `contains: { const: "http" }`, `minItems: 1` |
| `backend` | string | ✅ | — |
| `capabilities` | object | ✅ | Boolean flags: `batch_enqueue`, `cron_jobs`, `dead_letter`, `delayed_jobs`, `job_ttl`, `priority_queues`, `rate_limiting`, `schema_validation`, `unique_jobs`, `workflows`, `pause_resume`. `additionalProperties: true` |
| `extensions` | oneOf | ❌ | Either structured `{ official: extension_entry[], experimental: extension_entry[] }` or flat `string[]` |
| `endpoints` | object | ❌ | Properties: `base_url` (format: uri), `manifest`, `health`. `additionalProperties: true` |

**`extension_entry` ($defs):**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | `pattern: ^[a-z][a-z0-9]*(-[a-z0-9]+)*$` |
| `uri` | string | ✅ | `pattern: ^urn:ojs:ext:(experimental:)?[a-z][a-z0-9]*(-[a-z0-9]+)*$` |
| `version` | string | ✅ | — |

---

## HTTP Binding Schemas

### Enqueue Request (`http/enqueue-request.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/enqueue-request.json`  
**Required fields:** `type`, `args`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | string | ✅ | `pattern: ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$`, `minLength: 1`, `maxLength: 255` |
| `args` | array | ✅ | `items: true` |
| `meta` | object | ❌ | `additionalProperties: true` |
| `schema` | string | ❌ | `format: uri` |
| `options` | object | ❌ | `$ref: job-options.json` |

### Enqueue Response (`http/enqueue-response.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/enqueue-response.json`  
**Required fields:** `job`  
**additionalProperties:** `false`

The `job` sub-object has required: `id`, `type`, `state`, `args`, `queue`, `attempt`, `created_at`.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `job.id` | string | ✅ | UUIDv7 pattern |
| `job.type` | string | ✅ | — |
| `job.state` | string | ✅ | `enum: ["available", "scheduled", "pending"]` |
| `job.args` | array | ✅ | `items: true` |
| `job.meta` | object | ❌ | `additionalProperties: true` |
| `job.queue` | string | ✅ | — |
| `job.priority` | integer | ❌ | — |
| `job.attempt` | integer | ✅ | — |
| `job.max_attempts` | integer | ❌ | — |
| `job.created_at` | string | ✅ | `format: date-time` |
| `job.enqueued_at` | string | ❌ | `format: date-time` |
| `job.scheduled_at` | string | ❌ | `format: date-time` |
| `job.tags` | array | ❌ | `items: { type: string }` |

(`job` has `additionalProperties: true`)

### Batch Enqueue Request (`http/batch-enqueue-request.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/batch-enqueue-request.json`  
**Required fields:** `jobs`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `jobs` | array | ✅ | `items: $ref: enqueue-request.json`, `minItems: 1`, `maxItems: 10000` |

### Batch Enqueue Response (`http/batch-enqueue-response.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/batch-enqueue-response.json`  
**Required fields:** `jobs`, `count`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `jobs` | array | ✅ | Array of job summaries. Each item requires: `id` (UUIDv7), `type`, `state` (enum: available/scheduled/pending), `queue`, `created_at` (date-time). `additionalProperties: true` |
| `count` | integer | ✅ | `minimum: 1` |

### Fetch Request (`http/fetch-request.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/fetch-request.json`  
**Required fields:** `queues`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `queues` | array | ✅ | `items: { pattern: ^[a-z0-9][a-z0-9\-\.]*$ }`, `minItems: 1` |
| `count` | integer | ❌ | `minimum: 1`, `default: 1` |
| `worker_id` | string | ❌ | `minLength: 1` |
| `visibility_timeout_ms` | integer | ❌ | `minimum: 1000`, `default: 30000` |

### Fetch Response (`http/fetch-response.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/fetch-response.json`  
**Required fields:** `jobs`  
**additionalProperties:** `false`

Each job item requires: `id` (UUIDv7), `type`, `state` (const: `"active"`), `args` (array), `queue`, `attempt` (minimum: 1). Also includes `meta`, `max_attempts`, `timeout_ms`, `created_at`, `enqueued_at`, `started_at` (all date-time), `tags`. Job items have `additionalProperties: true`.

### ACK Request (`http/ack-request.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/ack-request.json`  
**Required fields:** `job_id`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `job_id` | string | ✅ | UUIDv7 pattern |
| `result` | any | ❌ | No type constraint |

### NACK Request (`http/nack-request.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/nack-request.json`  
**Required fields:** `job_id`, `error`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `job_id` | string | ✅ | UUIDv7 pattern |
| `error` | object | ✅ | See sub-table |

**`error` sub-object:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | ✅ | `enum: ["handler_error", "timeout", "cancelled", "invalid_payload", "invalid_request", "not_found", "backend_error", "rate_limited", "duplicate", "queue_paused", "schema_validation", "unsupported"]` |
| `message` | string | ✅ | `minLength: 1` |
| `retryable` | boolean | ❌ | — |
| `details` | object | ❌ | `additionalProperties: true` |

(`error` has `additionalProperties: false`)

### Heartbeat Request (`http/heartbeat-request.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/heartbeat-request.json`  
**Required fields:** `worker_id`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `worker_id` | string | ✅ | `minLength: 1` |
| `active_jobs` | array | ❌ | `items: { type: string }` |
| `visibility_timeout_ms` | integer | ❌ | `minimum: 1000` |

### Heartbeat Response (`http/heartbeat-response.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/http/heartbeat-response.json`  
**Required fields:** `state`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `state` | string | ✅ | `enum: ["running", "quiet", "terminate"]` |
| `jobs_extended` | array | ❌ | `items: { type: string }` |
| `server_time` | string | ❌ | `format: date-time` |

---

## Extension Schemas

### Progress (`progress.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/progress.json`

**`progressUpdate` definition:**  
**Constraint:** `anyOf: [required: progress, required: data]` — at least one must be present.  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `progress` | number | Conditional | `minimum: 0.0`, `maximum: 1.0` |
| `data` | object | Conditional | — |
| `checkpoint` | object | ❌ | — |

**`progressResponse` definition:**  
**Required fields:** `job_id`, `state`, `updated_at`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `job_id` | string | ✅ | UUIDv7 pattern |
| `state` | string | ✅ | `enum: ["scheduled","available","pending","active","completed","retryable","cancelled","discarded"]` |
| `progress` | number\|null | ❌ | `minimum: 0.0`, `maximum: 1.0` |
| `data` | object\|null | ❌ | — |
| `updated_at` | string | ✅ | `format: date-time` |

---

### Checkpoint (`checkpoint.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/checkpoint.json`

**`checkpointRequest` definition:**  
**Required fields:** `state`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `state` | any | ✅ | Any valid JSON value. Max 1 MB when serialized. |
| `sequence` | integer | ❌ | `minimum: 0` |

**`checkpointResponse` definition:**  
**Required fields:** `job_id`, `state`, `sequence`, `created_at`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `job_id` | string | ✅ | UUIDv7 pattern |
| `state` | any | ✅ | — |
| `sequence` | integer | ✅ | `minimum: 0` |
| `created_at` | string | ✅ | `format: date-time` |

---

### Affinity (`affinity.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/affinity.json`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `required` | array | ❌ | `items: $ref: #/$defs/affinity-rule` |
| `preferred` | array | ❌ | `items: $ref: #/$defs/affinity-rule` |

**`affinity-rule` ($defs):**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `key` | string | ✅ | — |
| `operator` | string | ✅ | `enum: ["In", "NotIn", "Exists", "DoesNotExist"]` |
| `values` | array | ❌ | `items: { type: string }` |

---

### Webhook (`webhook.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/webhook.json`

**`webhookSubscription` definition:**  
**Required fields:** `url`, `events`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | ❌ | UUIDv7 pattern |
| `url` | string | ✅ | `format: uri` |
| `events` | array | ✅ | `items: { minLength: 1, maxLength: 128 }`, `minItems: 1`, `uniqueItems: true` |
| `active` | boolean | ❌ | `default: true` |
| `secret` | string | ❌ | `minLength: 32`, `maxLength: 256` |
| `metadata` | object | ❌ | `additionalProperties: { type: string }` |
| `filter` | object | ❌ | Properties: `queues` (array, uniqueItems), `job_types` (array, uniqueItems). `additionalProperties: false` |
| `created_at` | string | ❌ | `format: date-time` |

**`webhookDelivery` definition:**  
**Required fields:** `event_type`, `delivery_id`, `subscription_id`, `timestamp`, `data`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `event_type` | string | ✅ | — |
| `delivery_id` | string | ✅ | — |
| `subscription_id` | string | ✅ | — |
| `timestamp` | integer | ✅ | Unix seconds |
| `data` | object | ✅ | — |

**`deliveryHeaders` definition:**  
**Required fields:** `Content-Type`, `X-OJS-Event-Type`, `X-OJS-Delivery-ID`, `X-OJS-Subscription-ID`, `X-OJS-Signature`, `X-OJS-Timestamp`

| Header | Constraints |
|--------|-------------|
| `Content-Type` | `const: "application/json"` |
| `X-OJS-Signature` | `pattern: ^sha256=[a-f0-9]{64}$` |
| `X-OJS-Timestamp` | `pattern: ^[0-9]+$` |

---

### Encryption (`encryption.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/encryption.json`

**`codecMetadata` definition:**

| Field | Type | Constraints |
|-------|------|-------------|
| `ojs.codec.encodings` | array | `items: { minLength: 1, maxLength: 128 }`, `minItems: 1` |
| `ojs.codec.key_id` | string | `minLength: 1`, `maxLength: 256` |

**`encodedPayload` definition:**  
**Required fields:** `ojs_encoded`, `encoding`, `data`  
**additionalProperties:** `false`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `ojs_encoded` | boolean | ✅ | `const: true` |
| `encoding` | string | ✅ | `minLength: 1`, `maxLength: 128` |
| `data` | string | ✅ | `contentEncoding: "base64"` |
| `metadata` | object | ❌ | Properties: `encryption_key_id` (minLength: 1, maxLength: 256). `additionalProperties: true` |

**`encryptionParameters` definition:**  
**additionalProperties:** `false`

| Field | Type | Constraints |
|-------|------|-------------|
| `algorithm` | string | `const: "AES-256-GCM"` |
| `key_size_bits` | integer | `const: 256` |
| `nonce_size_bytes` | integer | `const: 12` |
| `tag_size_bytes` | integer | `const: 16` |

---

### Workflow Builder (`workflow-builder.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/workflow-builder.json`  
**Required fields:** `version`, `workflow`, `canvas`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `version` | string | ✅ | `const: "1.0"` |
| `metadata` | object | ❌ | Properties: `name` (maxLength: 128), `description` (maxLength: 1024), `author`, `created_at` (date-time), `updated_at` (date-time), `tags` (array of strings) |
| `workflow` | object | ✅ | `$ref: workflow.schema.json` |
| `canvas` | object | ✅ | Required: `nodes`, `edges`. `zoom` (minimum: 0.1, maximum: 5.0, default: 1.0) |
| `codegen` | object | ❌ | `language` enum: go/typescript/python/java/rust/ruby/csharp. `style` enum: inline/modular |

**`canvas_node` ($defs):**  
Required: `id`, `type`, `position`

| Field | Type | Constraints |
|-------|------|-------------|
| `type` | string | `enum: ["job", "chain", "group", "batch", "callback", "start", "end"]` |
| `position` | object | Required: `x` (number), `y` (number) |
| `dimensions` | object | `width` (default: 200), `height` (default: 80) |
| `collapsed` | boolean | `default: false` |

**`canvas_edge` ($defs):**  
Required: `id`, `source`, `target`

| Field | Type | Constraints |
|-------|------|-------------|
| `type` | string | `enum: ["sequential", "parallel", "callback", "error"]`, `default: "sequential"` |
| `animated` | boolean | `default: false` |

---

### ML/AI Resources (`ml-resources.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/ml-resources.json`  
**additionalProperties:** `false`

| Field | Type | Constraints |
|-------|------|-------------|
| `gpu.count` | integer | `minimum: 0`, `default: 0` |
| `gpu.type` | string | — |
| `gpu.memory_gb` | number | `minimum: 0` |
| `gpu.compute_capability` | string | `pattern: ^\d+\.\d+$` |
| `gpu.interconnect` | string | `enum: ["nvlink", "pcie", "any"]`, `default: "any"` |
| `tpu.type` | string | `enum: ["v4", "v5e", "v5p", "v6e"]` |
| `tpu.topology` | string | `pattern: ^\d+x\d+(x\d+)?$` |
| `tpu.chip_count` | integer | `minimum: 1` |
| `cpu.cores` | integer | `minimum: 1` |
| `memory_gb` | number | `minimum: 0` |
| `storage_gb` | number | `minimum: 0` |
| `shm_size_gb` | number | `minimum: 0` |
| `model.name` | string | Required. `minLength: 1` |
| `model.version` | string | — |
| `model.registry` | string | — |
| `model.checksum` | string | `pattern: ^[a-z0-9]+:[a-f0-9]+$` |
| `model.format` | string | `enum: ["safetensors", "gguf", "onnx", "torchscript", "savedmodel", "custom"]` |
| `runtime` | string | `enum: ["pytorch", "tensorflow", "onnx", "triton", "vllm", "tgi", "custom"]` |
| `precision` | string | `enum: ["fp32", "fp16", "bf16", "fp8", "int8", "int4"]` |
| `distributed_strategy` | string | `enum: ["none", "data_parallel", "tensor_parallel", "pipeline_parallel", "fsdp", "deepspeed"]` |
| `checkpoint.enabled` | boolean | `default: false` |
| `checkpoint.interval_s` | integer | `minimum: 10`, `default: 300` |
| `checkpoint.storage_uri` | string | `format: uri` |
| `checkpoint.max_checkpoints` | integer | `minimum: 1`, `default: 3` |
| `preemption.preemptible` | boolean | — |
| `preemption.grace_period_s` | integer | `minimum: 0`, `default: 30` |
| `preemption.checkpoint_on_preempt` | boolean | `default: false` |
| `node_selector` | object | `additionalProperties: { type: string }` |

---

### ML Pipeline Extensions (`ml-extensions.schema.json`)

**$id:** `https://openjobspec.org/schema/v1/ml-extensions.schema.json`  
**additionalProperties:** `true`

| Field | Type | Constraints |
|-------|------|-------------|
| `ext_mlx_model_name` | string | `maxLength: 256` |
| `ext_mlx_model_version` | string | `pattern: ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$` |
| `ext_mlx_model_framework` | string | `enum: ["pytorch","tensorflow","jax","onnx","vllm","triton","other"]` |
| `ext_mlx_model_input_schema` | object | — |
| `ext_mlx_model_output_schema` | object | — |
| `ext_mlx_training_dataset_uri` | string | `format: uri` |
| `ext_mlx_training_validation_uri` | string | `format: uri` |
| `ext_mlx_training_hyperparameters` | object | `additionalProperties: true` |
| `ext_mlx_training_epochs` | integer | `minimum: 1` |
| `ext_mlx_training_checkpoint_uri` | string | `format: uri` |
| `ext_mlx_training_resume_from` | string | `format: uri` |
| `ext_mlx_training_output_model_uri` | string | `format: uri` |
| `ext_mlx_inference_mode` | string | `enum: ["batch", "streaming", "realtime"]` |
| `ext_mlx_inference_max_tokens` | integer | `minimum: 1` |
| `ext_mlx_inference_temperature` | number | `minimum: 0`, `maximum: 2` |
| `ext_mlx_experiment_id` | string | `maxLength: 256` |
| `ext_mlx_run_id` | string | `maxLength: 256` |
| `ext_mlx_evaluation_metrics` | object | `additionalProperties: { type: number }` |
| `ext_mlx_evaluation_dataset_uri` | string | `format: uri` |
| `ext_mlx_preprocessing_input_uri` | string | `format: uri` |
| `ext_mlx_preprocessing_output_uri` | string | `format: uri` |
| `ext_mlx_preprocessing_transforms` | array | `items: { type: string }` |
| `ext_mlx_artifact_uris` | object | `additionalProperties: { type: string, format: uri }` |

---

### ML Resource Extension (flat) (`extensions/ml-resources.schema.json`)

**$id:** `https://openjobspec.org/schemas/extensions/ml-resources.json`  
**additionalProperties:** `false`

This is the flat-field variant for `ext_ml_*` job envelope attributes.

| Field | Type | Constraints |
|-------|------|-------------|
| `gpu_type` | string | — |
| `gpu_count` | integer | `minimum: 1`, `maximum: 128` |
| `gpu_memory_gb` | number | `minimum: 1`, `exclusiveMinimum: 0` |
| `gpu_compute_capability` | string | `pattern: ^\d+\.\d+$` |
| `gpu_interconnect` | string | `enum: ["nvlink", "pcie", "any"]`, `default: "any"` |
| `tpu_type` | string | `enum: ["v4", "v5e", "v5p", "v6e"]` |
| `tpu_topology` | string | `pattern: ^\d+x\d+(x\d+)?$` |
| `tpu_chip_count` | integer | `minimum: 1`, `maximum: 1024` |
| `memory_gb` | number | `exclusiveMinimum: 0` |
| `storage_gb` | number | `minimum: 0` |
| `shm_size_gb` | number | `minimum: 0` |
| `cpu_cores` | integer | `minimum: 1` |
| `model_id` | string | `minLength: 1` |
| `model_version` | string | — |
| `model_provider` | string | `enum: ["openai","anthropic","google","huggingface","replicate","local","custom"]` |
| `model_checksum` | string | `pattern: ^[a-z0-9]+:[a-f0-9]+$` |
| `model_format` | string | `enum: ["safetensors","gguf","onnx","torchscript","savedmodel","custom"]` |
| `runtime` | string | `enum: ["pytorch","tensorflow","onnx","triton","vllm","tgi","custom"]` |
| `precision` | string | `enum: ["fp32","fp16","bf16","fp8","int8","int4"]` |
| `distributed_strategy` | string | `enum: ["none","data_parallel","tensor_parallel","pipeline_parallel","fsdp","deepspeed"]` |
| `priority_class` | string | `enum: ["spot", "on-demand", "reserved"]` |
| `preemptible` | boolean | — |
| `preemption_grace_period_s` | integer | `minimum: 0`, `maximum: 3600`, `default: 30` |
| `checkpoint_on_preempt` | boolean | `default: false` |
| `checkpoint_enabled` | boolean | `default: false` |
| `checkpoint_interval_s` | integer | `minimum: 10`, `maximum: 86400`, `default: 300` |
| `checkpoint_storage_uri` | string | `format: uri` |
| `checkpoint_max_count` | integer | `minimum: 1`, `maximum: 100`, `default: 3` |
| `max_tokens` | integer | `minimum: 1`, `maximum: 10000000` |
| `max_batch_size` | integer | `minimum: 1`, `maximum: 100000` |
| `timeout_seconds` | integer | `minimum: 1`, `maximum: 604800` |
| `accelerator_required` | boolean | `default: false` |
| `node_selector` | object | `additionalProperties: { type: string }` |
| `reservation_id` | string | — |

---

### Federation (`federation.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/federation.schema.json`  
**Required fields:** `version`, `topology`, `regions`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `version` | string | ✅ | `const: "1.0"` |
| `topology` | string | ✅ | `enum: ["hub-spoke", "mesh"]` |
| `local_region` | string | ❌ | — |
| `regions` | array | ✅ | `minItems: 2`, items: region objects (required: `id`, `url`). `id` has `pattern: ^[a-z0-9-]+$`, `maxLength: 64`. `url` has `format: uri`. `weight`: minimum 0, maximum 100, default 100. |
| `routing.strategy` | string | ❌ | `enum: ["affinity","round-robin","weighted","geo-pin","overflow","latency"]`, `default: "affinity"` |
| `routing.fallback_strategy` | string | ❌ | `enum: ["round-robin","weighted","random"]`, `default: "round-robin"` |
| `health_check.interval_seconds` | integer | ❌ | `minimum: 1`, `default: 10` |
| `health_check.timeout_seconds` | integer | ❌ | `minimum: 1`, `default: 5` |
| `health_check.unhealthy_threshold` | integer | ❌ | `minimum: 1`, `default: 3` |
| `health_check.healthy_threshold` | integer | ❌ | `minimum: 1`, `default: 2` |
| `replication.enabled` | boolean | ❌ | `default: false` |
| `replication.mode` | string | ❌ | `enum: ["metadata-only", "full"]`, `default: "metadata-only"` |
| `replication.max_lag_seconds` | integer | ❌ | `default: 30` |
| `circuit_breaker.enabled` | boolean | ❌ | `default: true` |
| `circuit_breaker.open_after_failures` | integer | ❌ | `minimum: 1`, `default: 5` |
| `circuit_breaker.half_open_after_seconds` | integer | ❌ | `minimum: 1`, `default: 30` |
| `circuit_breaker.probe_count` | integer | ❌ | `minimum: 1`, `default: 3` |

---

### Migration Export (`migration-export.schema.json`)

**$id:** `https://openjobspec.org/schemas/v1/migration-export.json`  
**Required fields:** `version`, `source`, `exported_at`, `jobs`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `version` | string | ✅ | `const: "1.0"` |
| `source` | object | ✅ | Required: `backend` (enum: redis/postgres/nats/kafka/sqs/lite), `url`. Optional: `version` |
| `target` | object | ❌ | `backend` enum: same as source |
| `exported_at` | string | ✅ | `format: date-time` |
| `options.include_completed` | boolean | ❌ | `default: false` |
| `options.include_dead_letter` | boolean | ❌ | `default: true` |
| `options.queues` | array | ❌ | `items: { type: string }` |
| `options.since` | string | ❌ | `format: date-time` |
| `jobs` | array | ✅ | Items: migration_job (required: id, type, queue, state, args). `state` enum: all 8 states. `retry` $ref: retry-policy.schema.json. `unique` $ref: unique-policy.schema.json |
| `cron_jobs` | array | ❌ | Items: migration_cron (required: name, expression, job_template). `overlap_policy` enum: allow/skip/cancel |
| `workflows` | array | ❌ | Items: migration_workflow (required: id, type, state). `type` enum: chain/group/batch. `state` enum: pending/running/completed/failed/cancelled |
| `checksum` | string | ❌ | SHA-256 integrity hash |

---

## Common Patterns

### UUIDv7 Pattern
```regex
^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
```

### Job Type Pattern (dot-namespaced)
```regex
^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$
```

### Queue Name Pattern
```regex
^[a-z0-9][a-z0-9\-\.]*$
```

### ISO 8601 Duration Pattern
```regex
^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$
```

### Extension URI Pattern
```regex
^urn:ojs:ext:(experimental:)?[a-z][a-z0-9]*(-[a-z0-9]+)*$
```

### Model Checksum Pattern
```regex
^[a-z0-9]+:[a-f0-9]+$
```

### Compute Capability Pattern
```regex
^\d+\.\d+$
```

### TPU Topology Pattern
```regex
^\d+x\d+(x\d+)?$
```

---

## Schema Cross-References

| Source Schema | Field | References |
|--------------|-------|------------|
| `job.schema.json` | `retry` | `$ref: retry-policy.json` |
| `job.schema.json` | `unique` | `$ref: unique-policy.json` |
| `job.schema.json` | `error` | `$ref: error.json` |
| `job-options.schema.json` | `retry` | `$ref: retry-policy.json` |
| `job-options.schema.json` | `unique` | `$ref: unique-policy.json` |
| `workflow.schema.json` | `options` | `$ref: job-options.json` |
| `workflow.schema.json` | step `options` | `$ref: job-options.json` |
| `cron.schema.json` | `options` | `$ref: job-options.json` |
| `http/enqueue-request` | `options` | `$ref: job-options.json` |
| `http/batch-enqueue-request` | `jobs[]` | `$ref: enqueue-request.json` |
| `workflow-builder` | `workflow` | `$ref: workflow.schema.json` |
| `migration-export` | `retry` | `$ref: retry-policy.schema.json` |
| `migration-export` | `unique` | `$ref: unique-policy.schema.json` |

---

## additionalProperties Summary

| Schema | `additionalProperties` |
|--------|----------------------|
| `job.schema.json` | `true` (forward-compatible) |
| `job-options.schema.json` | `false` (strict) |
| `retry-policy.schema.json` | `false` (strict) |
| `unique-policy.schema.json` | `false` (strict) |
| `error.schema.json` | `false` (strict) |
| `api-error.schema.json` | `false` (strict) |
| `event.schema.json` | `true` (forward-compatible) |
| `workflow.schema.json` | `true` (forward-compatible) |
| `cron.schema.json` | `false` (strict) |
| `queue-stats.schema.json` | `false` (strict; stats sub-object is `true`) |
| `worker-info.schema.json` | `true` (forward-compatible) |
| `manifest.schema.json` | `true` (forward-compatible) |
| `ml-resources.schema.json` | `false` (strict) |
| `ml-extensions.schema.json` | `true` (extensible) |
| All HTTP binding schemas | `false` (strict) |
