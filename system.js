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
	initialize(manager, scopeReporter, name, config, properties) {

		let childProcesses = {};

		properties._start = {
			value: function () {
				const step = this;
				const interceptedEndpoints = step.interceptedEndpoints;
				const command = config.command;
				const args = config.arguments;
				let options = {};

				if (config.env) {
					options.env = config.env;
				}

				interceptedEndpoints.command.receive = request => {
					let cp = {
						stdinRequest: request
					};

					options.stdio = [
						interceptedEndpoints.stdout,
						interceptedEndpoints.stderr
					].map(e => e.isConnected ? 'pipe' : 'ignore');

					cp.child = child_process.spawn(command, args, options);

					childProcesses[cp.child.pid] = cp;
				};

				interceptedEndpoints.stdin.receive = request => {
					return new Promise((fullfilled, rejected) => {
						let cp = {
							stdinRequest: request,
							responses: []
						};

						options.stdio = [
							interceptedEndpoints.stdin,
							interceptedEndpoints.stdout,
							interceptedEndpoints.stderr
						].map(e => e.isConnected ? 'pipe' : 'ignore');

						cp.child = child_process.spawn(command, args, options);

						childProcesses[cp.child.pid] = cp;

						step.info(level => `Process started: ${Object.keys(childProcesses)}`);

						cp.child.on('close', function (code, signal) {
							//console.log(`child process terminated with ${code} due to receipt of signal ${signal}`);
							delete childProcesses[cp.child.pid];
							step.info(level => `Process ended: ${Object.keys(childProcesses)}`);

							fullfilled(Promise.all(cp.responses));
						});

						request.stream.pipe(cp.child.stdin);

						if (interceptedEndpoints.stdout.isConnected) {
							cp.responses.push(interceptedEndpoints.stdout.send({
								info: {
									command: command
								},
								stream: cp.child.stdout
							}, request));
						}

						if (interceptedEndpoints.stderr.isConnected) {
							cp.responses.push(interceptedEndpoints.stderr.send({
								info: {
									command: command
								},
								stream: cp.child.stderr
							}, request));
						}
					});
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
