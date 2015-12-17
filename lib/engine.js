import stockfish from 'stockfish';
import Logger from './logger';
import _ from 'lodash';

class Engine {
  constructor(callback) {
    this.engine = stockfish();
    this.logger = new Logger();
    
    this.initializing = true;
    this.position = 'startpos';
    this.thinking = false;
    this.last_command;

    // Initialize engine to UCI standard
    this.send('uci');

    this.engine.onmessage = (line) => {
      this.logger.log('Line', line);

      // Check if we've just exited initialization, invoke callback if so
      if (this.initializing && this.last_command === 'uci' && line.indexOf('uciok') > -1) {
        this.initializing = false; // We're no longer initializing
        this.thinking = false; // We're not processing
        // this.logger.togglePrint(); // Start printing output to console
        
        if (_.isFunction(callback)) {
          this.logger.debug('Callback!');
          callback();
        }

      } else if (this.isFinished(line)) {
        this.logger.debug('line finished!');
        if (_.isFunction(this.callback)) {
          this.logger.debug('weve got a callback and were not afraid to use it');
          this.callback();
          this.callback = null;
        }
        this.thinking = false;
      }
    }
  }

  send(message, callback) {
    // No thinking needed for a position change
    if (!(message.indexOf('position ') > -1)) {
      this.thinking = true;
    }

    if (callback) {
      this.callback = callback;
    }

    this.last_command = message;
    this.logger.log('Sending', message);
    this.engine.postMessage(message);
  }

  isFinished(line) {
    if (this.last_command === 'd' && line.indexOf('Legal uci moves') > -1) {
      return true;
    } else if (this.last_command === 'eval' && line.indexOf('Total Evaluation:') > -1) {
      return true;
    } else if (line.indexOf('bestmove') > -1) {
      let match = line.match(/bestmove\s+(\S+)/);
      if (match) {
        this.logger.log('Best', match);
      }
      return true;
    } else {
      return false;
    }
  }
}

module.exports = Engine;