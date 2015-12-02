/* jslint node: true, esnext: true */

"use strict";

const child_process = require('child_process');

const systemStep = Object.assign({}, require('kronos-step').Step, {
	"name": "kronos-system",
	"description": "Starts a child process",
	"config": {
		"command": {
			"description": "command to execute",
			"type": "string"
		}
	},
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

		let child;

		properties._start = {
			value: function () {
				const step = this;

				let command = stepConfiguration.command;
				let args = [];
				let stdinRequest;
				let options = {};

				if (stepConfiguration.env) {
					options.env = stepDefinition.env;
				}

				if (stepConfiguration.arguments) {
					args = stepDefinition.arguments;
				}

				endpoints.command.receive(function* () {
					while (step.isRunning) {
						const request = yield;

						options.stdio = [endpoints.stdin ? 'pipe' : 'ignore',
							endpoints.stdout ? 'pipe' : 'ignore',
							endpoints.stderr ? 'pipe' : 'ignore'
						];

						child = child_process.spawn(command, args, options);

						if (endpoints.stdin) {
							endpoints.stdin.receive(function* () {
								stdinRequest = yield;
								stdinRequest.stream.pipe(child.stdin);
							});
						}

						if (endpoints.stdout) {
							endpoints.stdout.send({
								info: {
									command: command
								},
								stream: child.stdout
							});
						}

						if (endpoints.stderr) {
							endpoints.stderr.send({
								info: {
									command: command
								},
								stream: child.stderr
							});
						}
					}
				});

				return Promise.resolve(step);
			}
		};
		properties._stop = {
			value: function () {
				if (child) {
					if (stdinRequest) {
						stdinRequest.stream.unpipe(child.stdin);
						stdinRequest = undefined;
					}

					child.kill();
					child = undefined;
				}

				return Promise.resolve(this);
			}
		};

		return this;
	}
});

exports.registerWithManager = function (manager) {
	manager.registerStep(systemStep);
};
