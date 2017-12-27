import { Step } from 'kronos-step';

const child_process = require('child_process');

/**
 * Step to start processes
 */
export class SystemStep extends Step {
  /**
   * @return {string} 'kronos-system'
   */
  static get name() {
    return 'kronos-system';
  }

  static get description() {
    return 'Starts a child process and optionally feed stdin into';
  }
  static get endpoints() {
    return {
      command: {
        in: true
      },
      stdin: {
        in: true
      },
      stdout: {
        out: true
      },
      stderr: {
        out: true
      }
    };
  }

  constructor(...args) {
    super(...args);

    Object.defineProperty(this, 'childProcesses', { value: {} });
  }

  async _start() {
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

      options.stdio = [endpoints.stdout, endpoints.stderr].map(
        e => (e.isConnected ? 'pipe' : 'ignore')
      );

      cp.child = child_process.spawn(command, args, options);

      childProcesses[cp.child.pid] = cp;
    };

    endpoints.stdin.receive = request => {
      return new Promise((resolve, reject) => {
        let cp = {
          stdinRequest: request,
          responses: []
        };

        options.stdio = [
          endpoints.stdin,
          endpoints.stdout,
          endpoints.stderr
        ].map(e => (e.isConnected ? 'pipe' : 'ignore'));

        cp.child = child_process.spawn(command, args, options);

        childProcesses[cp.child.pid] = cp;

        this.trace(level => `Process started: ${command} @${cp.child.pid}`);

        cp.child.on('close', (code, signal) => {
          //console.log(`child process terminated with ${code} due to receipt of signal ${signal}`);
          this.info(level => `Process ended: ${cp.child.pid}`);
          resolve(Promise.all(cp.responses));
          delete childProcesses[cp.child.pid];
        });

        request.payload.pipe(cp.child.stdin);

        if (endpoints.stdout.isConnected) {
          cp.responses.push(
            endpoints.stdout.receive(
              {
                info: {
                  command: command
                },
                payload: cp.child.stdout
              },
              request
            )
          );
        }

        if (endpoints.stderr.isConnected) {
          cp.responses.push(
            endpoints.stderr.receive(
              {
                info: {
                  command: command
                },
                payload: cp.child.stderr
              },
              request
            )
          );
        }
      });
    };
  }

  async _stop() {
    Object.keys(this.childProcesses).forEach(pid => {
      const cp = this.childProcesses[pid];
      cp.child.kill();
      cp.stdinRequest.payload.unpipe(cp.child.stdin);
    });

    this.childProcesses = {};
  }
}

export async function registerWithManager(manager) {
  return manager.registerStep(SystemStep);
}
