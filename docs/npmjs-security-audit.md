# About audit reports | npm Docs

[Skip to search](#search-box-input)[Skip to content](#skip-to-content)

Table of contents

Audit reports contain tables of information about security vulnerabilities in your project's dependencies to help you fix the vulnerability or troubleshoot further.

![Screenshot showing command-line audit report results](https://docs.npmjs.com/packages-and-modules/securing-your-code/audit-report-results.png)

## [Vulnerability table fields](#vulnerability-table-fields)

-   [Severity](#severity)
-   [Description](#description)
-   [Package](#package)
-   [Patched in](#patched-in)
-   [Dependency of](#dependency-of)
-   [Path](#path)
-   [More info](#more-info)

## [Severity](#severity)

The severity of the vulnerability, determined by the impact and exploitability of the vulnerability in its most common use case.

| Severity | Recommended action |
| --- | --- |
| Critical | Address immediately |
| High | Address as quickly as possible |
| Moderate | Address as time allows |
| Low | Address at your discretion |

### [Description](#description)

The description of the vulnerability. For example, "Denial of service".

### [Package](#package)

The name of the package that contains the vulnerability.

### [Patched in](#patched-in)

The semantic version range that describes which versions contain a fix for the vulnerability.

### [Dependency of](#dependency-of)

The module that the package with the vulnerability depends on.

### [Path](#path)

The path to the code that contains the vulnerability.

### [More info](#more-info)

A link to the security report.

Navigated to About audit reports