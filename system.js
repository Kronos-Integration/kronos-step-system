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
	initialize(manager, name, config, properties) {
		let childProcesses = {};

		properties._start = {
			value: function () {
				const endpoints = this.endpoints;
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

				endpoints.command.receive = request => {
					let cp = {
						stdinRequest: request
					};

					options.stdio = [
						endpoints.stdout,
						endpoints.stderr
					].map(e => e.isConnected ? 'pipe' : 'ignore');

					cp.child = child_process.spawn(command, args, options);

					childProcesses[cp.child.pid] = cp;
				};

				endpoints.stdin.receive = request => {
					return new Promise((fullfilled, rejected) => {
						let cp = {
							stdinRequest: request,
							responses: []
						};

						options.stdio = [
							endpoints.stdin,
							endpoints.stdout,
							endpoints.stderr
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

						request.payload.pipe(cp.child.stdin);

						if (endpoints.stdout.isConnected) {
							cp.responses.push(endpoints.stdout.receive({
								info: {
									command: command
								},
								payload: cp.child.stdout
							}, request));
						}

						if (endpoints.stderr.isConnected) {
							cp.responses.push(endpoints.stderr.receive({
								info: {
									command: command
								},
								payload: cp.child.stderr
							}, request));
						}
					});
				};

				return Promise.resolve();
			}
		};
		properties._stop = {
			value: function () {
				Object.keys(childProcesses).forEach(pid => {
					const cp = childProcesses[pid];
					cp.child.kill();
					cp.stdinRequest.payload.unpipe(cp.child.stdin);
				});

				childProcesses = {};

				return Promise.resolve();
			}
		};

		return this;
	}
});

exports.registerWithManager = manager => manager.registerStep(systemStep);
