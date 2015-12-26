/* jslint node: true, esnext: true */

"use strict";

const child_process = require('child_process');

const systemStep = Object.assign({}, require('kronos-step').Step, {
	"name": "kronos-system",
	"description": "Starts a child process and optionally feed stdin into",
	"endpoints": {
		"command": {
			"in": true,
			"passive": true
		},
		"stdin": {
			"in": true,
			"mandatory": false,
			"passive": true
		},
		"stdout": {
			"out": true,
			"mandatory": false,
			"active": true
		},
		"stderr": {
			"out": true,
			"mandatory": false,
			"active": true
		}
	},
	initialize(manager, scopeReporter, name, stepConfiguration, endpoints, properties) {

		let childProcesses = {};

		properties._start = {
			value: function () {
				const step = this;

				const command = stepConfiguration.command;
				const args = stepConfiguration.args;
				let options = {};

				if (stepConfiguration.env) {
					options.env = stepDefinition.env;
				}

				if (stepConfiguration.arguments) {
					args = stepDefinition.arguments;
				}

				/*
								if (endpoints.command.isConnected) {
									endpoints.command.receive(function* () {
										let cp = {
											stdinRequest: request
										}

										options.stdio = ['ignore',
											endpoints.stdout ? 'pipe' : 'ignore',
											endpoints.stderr ? 'pipe' : 'ignore'
										];

										cp.child = child_process.spawn(command, args, options);

										childProcesses[cp.child.pid] = cp;
									});
								}
				*/

				endpoints.stdin.receive(function* () {
					while (step.isRunning) {
						const request = yield;

						let cp = {
							stdinRequest: request
						}

						options.stdio = [
							endpoints.stdin,
							endpoints.stdout,
							endpoints.stderr
						].map(e => e.isConnected ? 'pipe' : 'ignore')

						cp.child = child_process.spawn(command, args, options);

						childProcesses[cp.child.pid] = cp;

						console.log(`process started: ${Object.keys(childProcesses)}`);

						cp.child.on('close', function (code, signal) {
							//console.log(`child process terminated with ${code} due to receipt of signal ${signal}`);
							delete childProcesses[cp.child.pid];
							console.log(`process ended: ${Object.keys(childProcesses)}`);
						});

						request.stream.pipe(cp.child.stdin);

						/*
												if (endpoints.stdin) {
													endpoints.stdin.receive(function* () {
														stdinRequest = yield;
														stdinRequest.stream.pipe(child.stdin);
													});
												}
						*/

						if (endpoints.stdout.isConnected) {
							endpoints.stdout.send({
								info: {
									command: command
								},
								stream: cp.child.stdout
							});
						}

						if (endpoints.stderr.isConnected) {
							endpoints.stderr.send({
								info: {
									command: command
								},
								stream: cp.child.stderr
							});
						}
					}
				});

				return Promise.resolve(step);
			}
		};
		properties._stop = {
			value: function () {
				Object.keys(childProcesses).forEach(pid => {
					const cp = childProcesses[pid];
					cp.child.kill();
					cp.stdinRequest.stream.unpipe(cp.child.stdin);
				});

				childProcesses = {};

				return Promise.resolve(this);
			}
		};

		return this;
	}
});

exports.registerWithManager = function (manager) {
	manager.registerStep(systemStep);
};
