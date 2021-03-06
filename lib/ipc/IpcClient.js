const net = require('net');

class IpcClient {
  constructor(path, cb) {
    this.path = path;
    this.cb = cb;
    this.socket = null;
    this.queue = [];
    this.listeners = {};
    this.connect();
  }

  connect() {
    this.socket = net.connect(this.path, () => {
      this.socket.setEncoding('utf8');
      this.socket.setNoDelay(true);

      // flush queue
      if (this.queue.length > 0) {
        this.socket.write(this.queue.join(''));
        this.queue = [];
      }
    });

    let buffer = '';
    this.socket.on('data', (dataOriginal) => {
      const data = (buffer + dataOriginal).split('\n');
      buffer = data.pop();
      for (const line of data) {
        this.cb.apply(this.cb, JSON.parse(line));
      }
    });

    this.socket.on('error', (err) => {
      this.socket = null;
      setTimeout(this.connect.bind(this), 3000);
    });
  }

  send(...args) {
    const line = `${JSON.stringify(args)}\n`;
    if (this.socket != null) {
      this.socket.write(line);
    } else {
      this.queue.push(line);
    }
  }
}

/** *********
 * Exports *
 ********** */
module.exports = IpcClient;
