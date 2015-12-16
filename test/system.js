/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should();
chai.use(require("chai-as-promised"));

const path = require('path'),
  fs = require('fs');

const testStep = require('kronos-test-step'),
  BaseStep = require('kronos-step');

const manager = testStep.managerMock;

require('../system').registerWithManager(manager);

describe('system', function () {
  const sys = manager.steps['kronos-system'].createInstance(manager, undefined, {
    name: "myStep",
    type: "kronos-system",
    command: "cat",
    args: ['-u' /*, path.join(__dirname, 'system.js')*/ ]
  });

  const stdinEndpoint = BaseStep.createEndpoint('stdin-test', {
    "out": true,
    "active": true
  });

  stdinEndpoint.connect(sys.endpoints.stdin);


  const stdoutEndpoint = BaseStep.createEndpoint('stdout-test', {
    "in": true,
    "passive": true
  });

  let stdoutRequest;

  stdoutEndpoint.connect(sys.endpoints.stdout);

  stdoutEndpoint.receive(function* () {
    stdoutRequest = yield;
    console.log("**** Request: ");
    //stdoutRequest.stream.pipe(process.stdout);
  });

  const stderrEndpoint = BaseStep.createEndpoint('stderr-test', {
    "in": true,
    "passive": true
  });

  stderrEndpoint.connect(sys.endpoints.stderr);

  let stderrRequest;

  stderrEndpoint.receive(function* () {
    stderrRequest = yield;
  });

  /*
      const commandEndpoint = BaseStep.createEndpoint('test', {
        "out": true,
        "active": true
      });

      commandEndpoint.connect(sys.endpoints.command);
    */

  describe('static', function () {
    testStep.checkStepStatic(manager, sys);
  });

  describe('live-cycle', function () {
    let wasRunning = false;
    testStep.checkStepLivecycle(manager, sys, function (step, state, livecycle, done) {
      if (state === 'running' && !wasRunning) {
        //console.log(`${state}: ${livecycle.statesHistory}`);

        for (let i = 0; i < 2; i++) {
          const stream = fs.createReadStream(path.join(__dirname, 'system.js'), {
            encoding: 'utf8'
          });

          stdinEndpoint.send({
            stream: stream
          });
        }

        /*
                        testCommandEndpoint.send({
                          data: [{
                            type: "stop",
                            flow: "sample"
                          }]
                        });
                */
        wasRunning = true;
      }

      if (state === 'stopped' && wasRunning) {
        assert.equal(stdoutRequest.info.command, 'cat');
      }

      done();
    });
  });
});
