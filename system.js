/* jslint node: true, esnext: true */

"use strict";

const child_process = require('child_process');

const systemStep = Object.assign({}, require('kronos-step').Step, {
	"name": "kronos-system",
	"description": "Starts a child process and optionally feed stdin into",
	"endpoints": {
		"command": {
			"in": true
		},
		"stdin": {
			"in": true
		},
		"stdout": {
			"out": true
		},
		"stderr": {
			"out": true
		}
	},
	initialize(manager, scopeReporter, name, stepConfiguration, properties) {

		let childProcesses = {};

		properties._start = {
			value: function () {
				const step = this;
				const endpoints = step.endpoints;
				const command = stepConfiguration.command;
				const args = stepConfiguration.arguments;
				let options = {};

				if (stepConfiguration.env) {
					options.env = stepDefinition.env;
				}

				endpoints.command.receive = request => {
					let cp = {
						stdinRequest: request
					}

					options.stdio = [
						endpoints.stdout,
						endpoints.stderr
					].map(e => e.isConnected ? 'pipe' : 'ignore')

					cp.child = child_process.spawn(command, args, options);

					childProcesses[cp.child.pid] = cp;
				};

				endpoints.stdin.receive = request => {
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

					step.info(level => `process started: ${Object.keys(childProcesses)}`);

					cp.child.on('close', function (code, signal) {
						//console.log(`child process terminated with ${code} due to receipt of signal ${signal}`);
						delete childProcesses[cp.child.pid];
						step.info(level => `process ended: ${Object.keys(childProcesses)}`);
					});

					request.stream.pipe(cp.child.stdin);

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
				};

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
