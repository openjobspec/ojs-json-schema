# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/openjobspec/ojs-json-schema/compare/v0.1.0...v0.2.0) (2026-02-28)


### Features

* add schema definitions for cron extension ([727c0cd](https://github.com/openjobspec/ojs-json-schema/commit/727c0cd72f67b3ebccec2b5e844ffc3a3450874f))


### Bug Fixes

* align retry extension with core lifecycle states ([13377c7](https://github.com/openjobspec/ojs-json-schema/commit/13377c74fff68d621551ad97f910c1ef0e33571b))
* align retry extension with core lifecycle states ([73f6eee](https://github.com/openjobspec/ojs-json-schema/commit/73f6eeef9a383e3216e00861f2ec29f6c6cfaa7c))
* correct required fields in retry extension ([31876a7](https://github.com/openjobspec/ojs-json-schema/commit/31876a747b095925bb0a9042b00cd78b0c3adf57))
* correct RFC 2119 keyword usage ([f449f29](https://github.com/openjobspec/ojs-json-schema/commit/f449f29307494d6581c60216750ef3870b57a95d))


### Performance Improvements

* optimize data processing loop ([5c9768a](https://github.com/openjobspec/ojs-json-schema/commit/5c9768a5767d779614200c696520b6235aef3a1b))

## [1.0.0-rc.1] - 2025-06-01

### Added
- JSON Schema (draft 2020-12) definitions for OJS v1.0.0-rc.1
- Core schemas: job, job-options, error, event, workflow, cron, manifest
- HTTP binding schemas: enqueue-request, fetch-request, ack-request, heartbeat-request, and corresponding responses
- Policy schemas: retry-policy, unique-policy
- Named exports in package.json for direct schema imports
- AJV-based validation test suite
- README with installation, usage, and schema reference
