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
  endpoint = require('kronos-step').endpoint;

const manager = testStep.managerMock;

require('../system').registerWithManager(manager);

describe('system', function () {
  const sys = manager.steps['kronos-system'].createInstance(manager, undefined, {
    name: "myStep",
    type: "kronos-system",
    command: "cat",
    args: ['-u' /*, '/dev/zero'*/ /*, path.join(__dirname, 'system.js')*/ ]
  });

  const stdinEndpoint = new endpoint.SendEndpoint('stdin-test');

  stdinEndpoint.connected = sys.endpoints.stdin;


  const stdoutEndpoint = new endpoint.ReceiveEndpoint('stdout-test');

  sys.endpoints.stdout.connected = stdoutEndpoint;

  let stdoutRequest;

  stdoutEndpoint.receive = request => {
    stdoutRequest = request;
    stdoutRequest.stream.pipe(process.stdout);
  };

  const stderrEndpoint = new endpoint.ReceiveEndpoint('stderr-test');

  sys.endpoints.stderr.connected = stderrEndpoint;

  let stderrRequest;

  stderrEndpoint.receive = request => {
    stderrRequest = request;
  };

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

        for (let i = 0; i < 5; i++) {
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

        setTimeout(() => {
          console.log("wait over...");
          done();
        }, 1000);
        return;
      }

      if (state === 'stopped' && wasRunning) {
        assert.equal(stdoutRequest.info.command, 'cat');
      }

      done();
    });
  });
});
