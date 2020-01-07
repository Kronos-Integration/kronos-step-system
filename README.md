[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Known Vulnerabilities](https://snyk.io/test/github/Kronos-Integration/kronos-step-system/badge.svg)](https://snyk.io/test/github/Kronos-Integration/kronos-step-system)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm](https://img.shields.io/npm/v/kronos-step-system.svg)](https://www.npmjs.com/package/kronos-step-system)
[![Greenkeeper](https://badges.greenkeeper.io/Kronos-Integration/kronos-step-system.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/Kronos-Integration/kronos-step-system)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/kronos-step-system)](https://bundlephobia.com/result?p=kronos-step-system)
[![downloads](http://img.shields.io/npm/dm/kronos-step-system.svg?style=flat-square)](https://npmjs.org/package/kronos-step-system)
[![GitHub Issues](https://img.shields.io/github/issues/Kronos-Integration/kronos-step-system.svg?style=flat-square)](https://github.com/Kronos-Integration/kronos-step-system/issues)
[![Build Status](https://secure.travis-ci.org/Kronos-Integration/kronos-step-system.png)](http://travis-ci.org/Kronos-Integration/kronos-step-system)
[![codecov.io](http://codecov.io/github/Kronos-Integration/kronos-step-system/coverage.svg?branch=master)](http://codecov.io/github/Kronos-Integration/kronos-step-system?branch=master)
[![Coverage Status](https://coveralls.io/repos/Kronos-Integration/kronos-step-system/badge.svg)](https://coveralls.io/r/Kronos-Integration/kronos-step-system)

# kronos-step-system

Step to execute system commands

# sample

compress streams with gzip executable

```json
  "myStep" {
    "type": "kronos-system",
    "command": "gzip",
    "args": ["-c", "-9"],
    "endpoints" : {
      "stdin" : "otherStep/out",
      "stdout" : "yetAnotherStep/in"
    }
  }
```

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [SystemStep](#systemstep)
    -   [name](#name)

## SystemStep

**Extends Step**

Step to start processes

**Parameters**

-   `args` **...any** 

### name

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 'kronos-system'

# install

With [npm](http://npmjs.org) do:

```shell
npm install kronos-step-system
```

# license

BSD-2-Clause
