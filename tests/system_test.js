/* global describe, it, xit, before */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  path = require('path'),
  fs = require('fs');


const testStep = require('kronos-test-step'),
  ksm = require('kronos-service-manager'),
  endpoint = require('kronos-step').endpoint;

function StreamPromise(stream, result) {
  return new Promise((fullfilled, rejected) => stream.on('end', () => fullfilled(result)));
}


let stdoutRequest;
let stderrRequest;
let sys;
let manager;
let stdinEndpoint;
let stdoutEndpoint;

before(done => {
  ksm.manager({}, [require('../system')]).then(m => {
    sys = m.steps['kronos-system'].createInstance({
      name: "myStep",
      type: "kronos-system",
      command: "cat",
      _arguments: [ /*'-u' , '/dev/zero'*/ /*, path.join(__dirname, 'system.js')*/ ]
    }, m);

    stdinEndpoint = new endpoint.SendEndpoint('stdin-test');
    stdinEndpoint.connected = sys.endpoints.stdin;

    stdoutEndpoint = new endpoint.ReceiveEndpoint('stdout-test');
    sys.endpoints.stdout.connected = stdoutEndpoint;

    stdoutEndpoint.receive = (request, before) => {
      //console.log(`stdout: ${before.info.id}`);
      stdoutRequest = request;
      //stdoutRequest.stream.pipe(process.stdout);
      return StreamPromise(stdoutRequest.payload, {
        id: before.info.id,
        name: 'stdout'
      });
    };

    const stderrEndpoint = new endpoint.ReceiveEndpoint('stderr-test');
    sys.endpoints.stderr.connected = stderrEndpoint;

    stderrEndpoint.receive = (request, before) => {
      stderrRequest = request;
      return StreamPromise(request.payload, {
        id: before.info.id,
        name: 'stderr'
      });
    };

    manager = m;
    done();
  });
});

it('test spec', () => {
  describe('static', () => testStep.checkStepStatic(manager, sys));

  describe('live-cycle', () => {
    let wasRunning = false;
    testStep.checkStepLivecycle(manager, sys, (step, state, livecycle, done) => {
      if (state === 'running' && !wasRunning) {
        wasRunning = true;

        //console.log(`${state}: ${livecycle.statesHistory}`);

        const PROCESSES = 5;

        for (let i = 0; i < PROCESSES; i++) {
          const stream = fs.createReadStream(path.join(__dirname, 'system_test.js'), {
            encoding: 'utf8'
          });

          stdinEndpoint.receive({
            payload: stream,
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
          }).catch(done);
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
