# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-02-16)


### Features

* **schemas:** add affinity rules schema ([b7ff91e](https://github.com/openjobspec/ojs-json-schema/commit/b7ff91efdf83779454dc3cee3328bd1a609ebff8))
* **schemas:** add API error response schema ([abcc161](https://github.com/openjobspec/ojs-json-schema/commit/abcc16181fbff34de9dc1d7a3dec2146a61253bf))
* **schemas:** add error history field to job schema ([9ff60ea](https://github.com/openjobspec/ojs-json-schema/commit/9ff60ea525c1c81c1cd4fbc6219d3c53cd1139d8))
* **schemas:** add event, workflow, and cron schemas ([0a140de](https://github.com/openjobspec/ojs-json-schema/commit/0a140de65df514968599bcd1dc82a875ef910e9e))
* **schemas:** add foundational schemas (retry-policy, unique-policy, error) ([f22fb80](https://github.com/openjobspec/ojs-json-schema/commit/f22fb8021d722a56283c1921a2fd3e346d6a8d2f))
* **schemas:** add HTTP binding schemas ([7955dd8](https://github.com/openjobspec/ojs-json-schema/commit/7955dd8b70c4b54aee141200250390d52425c4ee))
* **schemas:** add job envelope and job-options schemas ([eca5228](https://github.com/openjobspec/ojs-json-schema/commit/eca522898d3d11c8094b874eddb3e64f9995e2e4))
* **schemas:** add ML/AI resource requirements schema ([27796f1](https://github.com/openjobspec/ojs-json-schema/commit/27796f1afe457d52a54ac3fb50392e0f3f0dc2cb))
* **schemas:** add operational schemas (queue-stats, worker-info, manifest) ([5406c53](https://github.com/openjobspec/ojs-json-schema/commit/5406c53c1b88002a0514a37b7093bf9e7ab6f2cc))
* **schemas:** add structured extensions format to manifest ([ee79baa](https://github.com/openjobspec/ojs-json-schema/commit/ee79baaa8e1bc844a4b4fb06f5db4a50ed70861f))

## [1.0.0-rc.1] - 2025-06-01

### Added
- JSON Schema (draft 2020-12) definitions for OJS v1.0.0-rc.1
- Core schemas: job, job-options, error, event, workflow, cron, manifest
- HTTP binding schemas: enqueue-request, fetch-request, ack-request, heartbeat-request, and corresponding responses
- Policy schemas: retry-policy, unique-policy
- Named exports in package.json for direct schema imports
- AJV-based validation test suite
- README with installation, usage, and schema reference
