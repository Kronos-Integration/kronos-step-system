[![npm](https://img.shields.io/npm/v/kronos-step-system.svg)](https://www.npmjs.com/package/kronos-step-system)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/Kronos-Integration/kronos-step-system)
[![Build Status](https://secure.travis-ci.org/Kronos-Integration/kronos-step-system.png)](http://travis-ci.org/Kronos-Integration/kronos-step-system)
[![bithound](https://www.bithound.io/github/Kronos-Integration/kronos-step-system/badges/score.svg)](https://www.bithound.io/github/Kronos-Integration/kronos-step-system)
[![codecov.io](http://codecov.io/github/Kronos-Integration/kronos-step-system/coverage.svg?branch=master)](http://codecov.io/github/Kronos-Integration/kronos-step-system?branch=master)
[![Code Climate](https://codeclimate.com/github/Kronos-Integration/kronos-step-system/badges/gpa.svg)](https://codeclimate.com/github/Kronos-Integration/kronos-step-system)
[![GitHub Issues](https://img.shields.io/github/issues/Kronos-Integration/kronos-step-system.svg?style=flat-square)](https://github.com/Kronos-Integration/kronos-step-system/issues)
[![Dependency Status](https://david-dm.org/Kronos-Integration/kronos-step-system.svg)](https://david-dm.org/Kronos-Integration/kronos-step-system)
[![devDependency Status](https://david-dm.org/Kronos-Integration/kronos-step-system/dev-status.svg)](https://david-dm.org/Kronos-Integration/kronos-step-system#info=devDependencies)
[![docs](http://inch-ci.org/github/Kronos-Integration/kronos-step-system.svg?branch=master)](http://inch-ci.org/github/Kronos-Integration/kronos-step-system)
[![downloads](http://img.shields.io/npm/dm/kronos-step-system.svg?style=flat-square)](https://npmjs.org/package/kronos-step-system)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)


Step to execute system commands

sample
======

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

install
=======

With [npm](http://npmjs.org) do:

```shell
npm install kronos-step-system
```

license
=======

BSD-2-Clause
