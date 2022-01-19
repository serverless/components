# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.18.2](https://github.com/serverless/components/compare/v3.18.1....v3.18.2) (2022-01-19)

- Stop polling logs when two errors happens in a row

## [3.18.1](https://github.com/serverless/components/compare/v3.18.0....v3.18.1) (2021-11-17)

- Improvement for YML genertation on Node proejct with HTTP component

## [3.18.0](https://github.com/serverless/components/compare/v3.17.2....v3.18.0) (2021-11-09)

- Add more error details for mixpanel report

## [3.17.2](https://github.com/serverless/components/compare/v3.17.1....v3.17.2) (2021-11-03)

- Fix wrong metrics URL for Chinese users

## [3.17.1](https://github.com/serverless/components/compare/v3.17.0....v3.17.1) (2021-09-22)

- Improve `sls dev`

## [3.17.0](https://github.com/serverless/components/compare/v3.16.0....v3.17.0) (2021-09-01)

- Record external error events
- Add --noValidation and --noCache support for deploy command

## [3.16.0](https://github.com/serverless/components/compare/v3.15.1....v3.16.0) (2021-08-25)

- Validation feature for CN users

## [3.15.1](https://github.com/serverless/components/compare/v3.15.0....v3.15.1) (2021-08-18)

- Fix `=` sign parsing issue for `sls deploy --input`
- Terminate process when users meet permission issue

## [3.15.0](https://github.com/serverless/components/compare/v3.14.2....v3.15.0) (2021-08-11)

- Invoke local for Php runtime for CN users
- Add `ciName` and `command` in `clientUid` field for CN users

## [3.14.2](https://github.com/serverless/components/compare/v3.14.1....v3.14.2) (2021-07-28)

- Fix commands map

## [3.14.1](https://github.com/serverless/components/compare/v3.14.0....v3.14.1) (2021-07-28)

- For CN users:
  - Detect invoking dir for templates
  - Improve custom commands for reporting events

## [3.14.0](https://github.com/serverless/components/compare/v3.13.4....v3.14.0) (2021-07-21)

- Support `--target` for `dev, logs, invoke` commands in templte for CN users
- Ignore timeout issue while polling logs

## [3.13.4](https://github.com/serverless/components/compare/v3.13.3....v3.13.4) (2021-07-13)

- Namespace and qualifrer support for sls invoke and logs
- Update help info

## [3.13.3](https://github.com/serverless/components/compare/v3.13.2....v3.13.3) (2021-07-07)

- Refactoring sls logs & invoke
- Add telemtry data collection for onboarding

## [3.13.2](https://github.com/serverless/components/compare/v3.13.1....v3.13.2) (2021-07-01)

- Fix bug that can not create new file in new dictionary

## [3.13.1](https://github.com/serverless/components/compare/v3.13.0....v3.13.1) (2021-07-01)

- Revoke wrong code

## [3.13.0](https://github.com/serverless/components/compare/v3.12.0....v3.13.0) (2021-06-30)

- Add Components metriecs collection

## [3.12.0](https://github.com/serverless/components/compare/v3.11.1....v3.12.0) (2021-06-09)

- Add `sls invoke`, `sls invoke local` and `sls logs` commands for multi-scf component
- Update help doc link in CLI

## [3.11.0](https://github.com/serverless/components/compare/v3.10.1....v3.11.0) (2021-06-02)

- `sls invoke local` supports **Python** runtime
- Fix `sls --help` show help informational inside template project.

## [3.10.1](https://github.com/serverless/components/compare/v3.10.0....v3.10.1) (2021-05-26)

- Refactoring `sls --help` command
- Replace `jsome` with `util.inspect`

## [3.10.0](https://github.com/serverless/components/compare/v3.9.2....v3.10.0) (2021-05-19)

- Add `sls logs` command for all components
- Add `sls invoke` command for scf component
- Add `sls invoke local` command for scf component

## [3.9.2](https://github.com/serverless/components/compare/v3.9.1...v3.9.2) (2021-05-05)

- Improve Chinese long-term login messages

## [3.9.1](https://github.com/serverless/components/compare/v3.9;0...v3.9.1) (2021-04-28)

- Improve long-term login messages
- Improve CLI logo

## [3.9.0](https://github.com/serverless/components/compare/v3.8.3...v3.9.0) (2021-04-21)

- Local long-term login feature for Chinese users
- Complete missing translations in CLI

## [3.8.3](https://github.com/serverless/components/compare/v3.8.2...v3.8.3) (2021-04-14)

- Update help doc [#931](https://github.com/serverless/components/pull/931)
- Display complete outputs [#930](https://github.com/serverless/components/pull/930)
- Fix dev log print issue [#927](https://github.com/serverless/components/pull/927)

## [3.8.2](https://github.com/serverless/components/compare/v3.8.1...v3.8.2) (2021-04-07)

- Update cli logs [#923](https://github.com/serverless/components/pull/923)
- Update utils version [#924](https://github.com/serverless/components/pull/924)

## [3.8.1](https://github.com/serverless/components/compare/v3.8.0...v3.8.1) (2021-03-31)

- Fix typo

## [3.8.0](https://github.com/serverless/components/compare/v3.7.7...v3.8.0) (2021-03-31)

- Process polish for commands: info, remove, registry, dev
- Random default app name after generation
- Login require for only needed cases.

## [3.7.7](https://github.com/serverless/components/compare/v3.7.6...v3.7.7) (2021-03-24)

- Reserve comments for templates([#913](https://github.com/serverless/components/pull/913))

## [3.7.6](https://github.com/serverless/components/compare/v3.7.5...v3.7.6) (2021-03-22)

- Recognize `user_uid` during `login` command and persist it in local config file ([#911](https://github.com/serverless/components/pull/911)) ([63b31712](https://github.com/serverless/components/commit/63b31712384b6be04a0893e18c79c9da9f30d7bc)) ([Piotr Grzesik](https://github.com/pgrzesik))

## [3.7.5](https://github.com/serverless/components/compare/v3.7.4...v3.7.5) (2021-03-17)

- Fix `dev mode` runtime bug

## [3.7.4](https://github.com/serverless/components/compare/v3.7.3...v3.7.4) (2021-03-16)

- sls registry info improve with translation
- sls component search support keyword search

## [3.7.3](https://github.com/serverless/components/compare/v3.7.2...v3.7.3) (2021-03-10)

- Improve non-nodejs debug experience (avoid close before start dev)
- Fix Windows CLI target dir \ path issue

## [3.7.2](https://github.com/serverless/components/compare/v3.7.1...v3.7.2) (2021-03-03)

- Show warning message for inline comments in the `dotenv` file: https://github.com/serverless/components/pull/898
- Fix the bug which can't request new login permission without a `dotenv` file: https://github.com/serverless/components/pull/899

## [3.7.1](https://github.com/serverless/components/compare/v3.7.0...v3.7.1) (2021-02-24)

- unsupported command error message
- Force cancel dev mode can't enter dev mode

## [3.7.0](https://github.com/serverless/components/compare/v3.6.2...v3.7.0) (2021-02-15)

- BREAKING - remove support for loading credentials from the local machine, and rely on providers instead.

## [3.6.2](https://github.com/serverless/components/compare/v3.6.1...v3.6.2) (2021-02-04)

- Use `@serverless/utils` to replace corresponding methods from `@serverless/platform-sdk`

## [3.6.1](https://github.com/serverless/components/compare/v3.6.0...v3.6.1) (2021-01-28)

- Fix a bug when using dev mode and the src input is pointing to a parent directory

## [3.6.0](https://github.com/serverless/components/compare/v3.5.1...v3.6.0) (2021-01-28)

- [Remove support for loading AWS credentials from the ~/.aws/credentials file.](https://github.com/serverless/components/pull/878)

## [3.5.1](https://github.com/serverless/components/compare/v3.5.0...v3.5.1) (2021-01-21)

- Fix: Pass orgUid for deployment when using dev mode

## [3.5.0](https://github.com/serverless/components/compare/v3.4.7...v3.5.0) (2021-01-20)

- Auto generate `serverless.yml` when `serverless deploy` for eggjs APP
- Update @serverless/platform-client-china version (support caching feature in China)

## 3.4.7 (2021-01-11)

- Integrate new Debug API for Chinese users

## [3.4.6](https://github.com/serverless/components/compare/v3.4.5...v3.4.6) (2021-01-07)

- Fix ordering when loading `.env` files from second level parent directories.

## [3.4.5](https://github.com/serverless/components/compare/v3.4.4...v3.4.5) (2021-01-07)

- Update dependencies to avoid security vulnerability in `axios`

## [3.4.4](https://github.com/serverless/components/compare/v3.4.3...v3.4.4) (2021-01-06)

- Update login logs #862
- Support http_proxy & https_proxy environment variables #838

## [3.4.3](https://github.com/serverless/components/compare/v3.4.2...v3.4.1) (2020-11-23)

- Update dashboard URL #846
- Fix `serverless deploy --target` bug #845
- Add `serverless info` support for nested template #842

## [3.4.2](https://github.com/serverless/components/compare/v3.4.1...v3.4.2) (2020-11-23)

- Revert v3.4.1

## [3.4.1](https://github.com/serverless/components/compare/v3.4.0...v3.4.1) (2020-11-20)

- Add Chinese translation for invalid commend error message
- Do not send local credential to backend

## [3.4.0](https://github.com/serverless/components/compare/v3.3.1...v3.4.0) (2020-11-19)

- Help Chinese users to deploy normal express/koa/nuxtjs/nextjs APP easier
  - Auto generate `serverless.yml` when `serverless deploy`
  - Remind them where and how to change their code when necessary

## [3.3.1](https://github.com/serverless/components/compare/v3.3.0...v3.3.1) (2020-11-09)

- Add a new command for Chinese users to bind CAM roles: `serverless bind role`

## [3.3.0](https://github.com/serverless/components/compare/v3.2.7...v3.3.0) (2020-10-28)

- Remove `app` property requirement from `sls publish` (because it's app is determined on `init`)
- Remove `name` and `stage` properties from root level `serverless.yml`
- Remove inputs from the yaml file when running `serverless remove`
- Remove support for single command deploys.

## [3.2.7](https://github.com/serverless/components/compare/v3.2.6...v3.2.7) (2020-10-23)

- For `sls registry` in China, use English description as fallback if no zh-cn description is found

## [3.2.6](https://github.com/serverless/components/compare/v3.2.5...v3.2.6) (2020-10-22)

- Convert the dash symbol in command to underscore symbol

## [3.2.5](https://github.com/serverless/components/compare/v3.2.4...v3.2.5) (2020-10-21)

- Feat: Add original src in inputs
- Improve onboarding experience in cli:
  - Only show featured templates on sls registry (remove components)
  - Add hit about how to initialize template
  - Use Chinese description for templates

## [3.2.4](https://github.com/serverless/components/compare/v3.2.2...v3.2.4) (2020-10-17)

- Feat: Add a traceId into proxy for tracing a full-chain request

## [3.2.3](https://github.com/serverless/components/compare/v3.2.2...v3.2.3) (2020-10-16)

- Bug fix: Parsing CLI inputs with key-value object

## [3.2.2](https://github.com/serverless/components/compare/v3.2.1...v3.2.2) (2020-10-15)

- Feature: Add support for serverless.template.yml
- Feature: Add detailed success/failure message for `runAll` of commands-cn
- Upgrade `@serverless/platform-client` to v3

## [3.2.1](https://github.com/serverless/components/compare/v3.2.0...v3.2.1) (2020-09-29)

- Bug fix: Fix deployment error handling for dev mode

## [3.2.0](https://github.com/serverless/components/compare/v3.1.5...v3.2.0) (2020-09-26)

- Feature: Add parameters setting feature for Chinese users

### [3.1.5](https://github.com/serverless/components/compare/v3.1.4...v3.1.5) (2020-09-25)

### Maintanance improvements

- Upgrade `@serverless/platform-client-china` to v2
- Upgrade `chalk` to v4
- Upgrade `globby` to v11
- Upgrade `got` to v11
- Upgrade `strip-ansi` to v6
- Remove not used dependencies (`uuid` and `ws`)

### [3.1.4](https://github.com/serverless/components/compare/v3.1.3...v3.1.4) (2020-09-23)

### Maintanance improvements

- Upgrade `@serverless/platform-client` to v2
- Upgrade `@serverless/utils` to v2 (and drop `@serverless/inquirer` dependency)

## [3.1.3](https://github.com/serverless/components/compare/v3.1.2...v3.1.3) (2020-09-09)

- Feature: Supports passing inputs via the CLI

## [3.1.2](https://github.com/serverless/components/compare/v3.1.1...v3.1.2) (2020-09-09)

- Bug Fix: Session stop with an error reason should result in an error process exit status code
- Bug Fix: Throw error when using plugins with components

## [3.1.1](https://github.com/serverless/components/compare/v3.1.0...v3.1.1) (2020-08-31)

- Bug Fix: As long as any config file existed(`yml` or `yaml` extension name), cli will write the name back to the origin file or create a new `yml` file for users in China

## [3.1.0](https://github.com/serverless/components/compare/v3.0.0...v3.1.0) (2020-08-31)

- Feature: Users in China can search case-insensitive name of components onboarding

## [3.0.0](https://github.com/serverless/components/compare/v2.34.9...v3.0.0) (2020-08-28)

### ⚠ BREAKING CHANGES

- Node.js version below v10 are no longer supported

### Features

- Drop support for Node.js versions below v10 ([3afcc20](https://github.com/serverless/components/commit/3afcc209e043ae817511e0b5c462c79856f75490))

### [2.34.9](https://github.com/serverless/components/compare/v2.34.8...v2.34.9) (2020-08-28)

- Bug fix: Fix dev mode deployment outputs

### [2.34.8](https://github.com/serverless/components/compare/v2.34.7...v2.34.8) (2020-08-27)

- Feature: When users in China init or use cli onboarding to create a new serverless project, the cli will repopulate the name variable into the app field of the yaml file.

### [2.34.7](https://github.com/serverless/components/compare/v2.34.6...v2.34.7) (2020-08-21)

- Dev Mode Fix: Fixes a bug that did not remove the agent from user applications when they disable Dev Mode. Since the agent was still running in prod apps, it was causing slow performance due to log/error streaming.

### [2.34.6](https://github.com/serverless/components/compare/v2.34.5...v2.34.6) (2020-08-19)

### Bug Fixes

- Fix Node.js v8 support ([#770](https://github.com/serverless/components/issues/770)) ([517a105](https://github.com/serverless/components/commit/517a105b963c4910e4d7a42fb7c95732a972c43b)) ([mzong](https://github.com/zongUMR))

### [2.34.5](https://github.com/serverless/components/compare/v2.34.4...v2.34.5) (2020-08-05)

- Adds unpublish command
- Inherit app property from template root if exists

### [2.34.4](https://github.com/serverless/components/compare/v2.34.3...v2.34.4) (2020-08-05)

Fix bug in init where process.cwd() was being used instead of the new directory, causing issues with configuration files.

### [2.34.3](https://github.com/serverless/components/compare/v2.34.2...v2.34.3) (2020-08-05)

Fix dev mode

### [2.34.1](https://github.com/serverless/components/compare/v2.34.0...v2.34.1) (2020-08-05)

_Maintanance Update_

## [2.34.0](https://github.com/serverless/components/compare/v2.33.4...v2.34.0) (2020-08-05)

### Features

- Error handling improvements ([Austen](https://github.com/ac360))

### Bug Fixes

- Fix `sls publish` command, so it works again ([#739](https://github.com/serverless/components/pull/739)) ([e4a3a0f](https://github.com/serverless/components/commit/e4a3a0f8543e74ee4602e308cfa8c4ef5067a66b)) ([AJ Stuyvenberg](https://github.com/astuyve))
