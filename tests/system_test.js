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
    _arguments: [ /*'-u' , '/dev/zero'*/ /*, path.join(__dirname, 'system.js')*/ ]
  });

  const stdinEndpoint = new endpoint.SendEndpoint('stdin-test');
  stdinEndpoint.connected = sys.endpoints.stdin;


  const stdoutEndpoint = new endpoint.ReceiveEndpoint('stdout-test');
  sys.endpoints.stdout.connected = stdoutEndpoint;


  function StreamPromise(stream, result) {
    return new Promise((fullfilled, rejected) => stream.on('end', () => fullfilled(result)));
  }

  let stdoutRequest;
  stdoutEndpoint.receive = (request, before) => {
    //console.log(`stdout: ${before.info.id}`);
    stdoutRequest = request;
    //stdoutRequest.stream.pipe(process.stdout);
    return StreamPromise(stdoutRequest.stream, {
      id: before.info.id,
      name: 'stdout'
    });
  };

  const stderrEndpoint = new endpoint.ReceiveEndpoint('stderr-test');
  sys.endpoints.stderr.connected = stderrEndpoint;

  let stderrRequest;

  stderrEndpoint.receive = (request, before) => {
    stderrRequest = request;
    return StreamPromise(request.stream, {
      id: before.info.id,
      name: 'stderr'
    });
  };

  describe('static', function () {
    testStep.checkStepStatic(manager, sys);
  });

  describe('live-cycle', function () {
    let wasRunning = false;
    testStep.checkStepLivecycle(manager, sys, function (step, state, livecycle, done) {
      if (state === 'running' && !wasRunning) {
        wasRunning = true;

        //console.log(`${state}: ${livecycle.statesHistory}`);

        const PROCESSES = 5;

        for (let i = 0; i < PROCESSES; i++) {
          const stream = fs.createReadStream(path.join(__dirname, 'system_test.js'), {
            encoding: 'utf8'
          });

          stdinEndpoint.send({
            stream: stream,
            info: {
              id: i
            }
          }).then(r => {
            try {
              assert.equal(r[0].name, 'stdout');
              assert.equal(r[1].name, 'stderr');

              if (r[0].id === PROCESSES - 1) {
                done();
              }
            } catch (e) {
              done(e);
            }
          });
        }

        return;
      }

      if (state === 'stopped' && wasRunning) {
        assert.equal(stdoutRequest.info.command, 'cat');
      }

      done();
    });
  });
});
