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
				const interceptedEndpoints = this.interceptedEndpoints;
				const command = config.command;
				let args;
				let options = {};

				['env', 'cwd', 'uid', 'gid'].forEach(a => {
					if (config[a] !== undefined) {
						options[a] = config[a];
					}
				});

				if (config.arguments) {
					args = config.arguments;
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

						this.info(level => `Process started: ${command} @${cp.child.pid}`);

						cp.child.on('close', (code, signal) => {
							//console.log(`child process terminated with ${code} due to receipt of signal ${signal}`);
							this.info(level => `Process ended: ${cp.child.pid}`);
							fullfilled(Promise.all(cp.responses));
							delete childProcesses[cp.child.pid];
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

				return Promise.resolve(this);
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
