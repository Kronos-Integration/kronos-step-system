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
    type: "kronos-system"
  });

  const testEndpoint = BaseStep.createEndpoint('test', {
    "out": true,
    "active": true
  });

  testEndpoint.connect(sys.endpoints.stdin);

  const testCommandEndpoint = BaseStep.createEndpoint('test', {
    "out": true,
    "active": true
  });

  testCommandEndpoint.connect(sys.endpoints.command);

  describe('static', function () {
    testStep.checkStepStatic(manager, sys);
  });

  describe('live-cycle', function () {
    let wasRunning = false;
    testStep.checkStepLivecycle(manager, sys, function (step, state, livecycle) {
      if (state === 'running' && !wasRunning) {
        console.log(`${state}: ${livecycle.statesHistory}`);

        /*
                testEndpoint.send({
                  stream: flowStream
                });

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
        console.log(`state: ${state}`);
        //assert.equal(manager.flows['sample'].name, 'sample');
      }
    });
  });
});
