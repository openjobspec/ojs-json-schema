# Contributing

## Release automation

Release Please reads `release-please-config.json` and
`.release-please-manifest.json`. The manifest records the last published
version; never pin the next release with a persistent `release-as`.
`RELEASE_PLEASE_TOKEN` must be a GitHub App token or fine-grained PAT that can
create release pull requests and releases and trigger downstream workflows.

Thank you for your interest in contributing to Open Job Spec!

## Getting started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am "feat: add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Guidelines

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages

## Reporting issues

Use GitHub Issues to report bugs or request features. Please check existing issues first.

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
