'use strict';
/**
 * The Websocket client
 * Configuration arguments:
 *  - url: the URL to connect to the server
 *  - key: The UNLOQ.io API Token to use, defaults to process.env.UNLOQ_KEY
 *  - options: additional socket.io-client options. For more, visit https://github.com/socketio/socket.io-client/blob/master/docs/API.md
 *
 */
const io = require('socket.io-client'),
  url = require('url'),
  EventEmitter = require('events').EventEmitter;

const config = Symbol(),
  drain = Symbol(),
  client = Symbol();

const DISPATCH = 'dispatch';

class UIAMPClient extends EventEmitter {

  constructor(opt) {
    super();
    this[drain] = [];
    if (typeof opt !== 'object' || !opt) opt = {};
    if (typeof opt.url !== 'string' || !opt.url) {
      throw new Error('uiamp-client: requires url in configuration')
    }
    if (typeof opt.key !== 'string' || !opt.key) {
      opt.key = process.env.UNLOQ_KEY;
    }
    if (!opt.key) {
      throw new Error('uiamp-client: requires UNLOQ API key.');
    }

    if (typeof opt.options !== 'object' || !opt.options) opt.options = {};
    if (!opt.options.path) opt.options.path = '/ws';
    opt.options.reconnectionDelay = 1000;
    opt.options.randomizationFactor = 0;
    opt.options.timeout = 1000;
    opt.options.extraHeaders = {
      'user-agent': 'uiamp-client',
      Authorization: `Bearer ${opt.key}`
    };
    this[config] = opt;
    this.connected = false;
  }

  /**
   * Manually trigger a custom API action to UNLOQ
   * */
  trigger(actionName, payload) {
    if (typeof actionName !== 'string') return Promise.reject(error('DATA.INVALID', 'Missing action name'));
    if (typeof payload !== 'object' || !payload) payload = {};
    return this.dispatch('api.custom', {
      action: actionName,
      payload: payload
    }).then((res) => res.result);
  }

  /**
   * Sends a specific event to the server.
   * */
  dispatch(actionName, payload) {
    if (typeof actionName !== 'string' || !actionName) {
      return Promise.reject(error('DATA.INVALID', 'Missing or invalid action name'));
    }
    if (typeof payload !== 'object' || !payload) {
      payload = {};
    }
    let data = {
      type: actionName,
      payload: payload
    };
    if (this.connected) {
      return new Promise((resolve, reject) => {
        this[client].emit(DISPATCH, data, (err, res) => {
          if (err) return reject(parseError(err));
          if (typeof res !== 'object' || !res) res = {};
          if (typeof res.type === 'string') delete res.type;
          resolve(res);
        });
      });
    }
    return this.connect().then(() => {
      return new Promise((resolve, reject) => {
        this[client].emit(DISPATCH, data, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
      });
    });
  }

  /*
   * Initiates the connection to the server.
   * */
  connect() {
    if (this.connected) return Promise.resolve();
    if (!this[client]) { // connecting
      let socketObj = io(this[config].url, this[config].options),
        wasConnected = false;
      this[client] = socketObj;
      socketObj
        .on('connect', () => {
          wasConnected = true;
          this.connected = true;
          this.emit('connect');
        })
        .on('disconnect', (msg) => {
          this.connected = false;
          let e;
          if (!wasConnected && msg === 'transport close') {
            e = error('AUTHORIZATION', 'Invalid API Key');
          }
          this.emit('disconnect', e);
          if (e) {
            socketObj.disconnect();
          }
        })
        .on('error', (e) => {
          this.connected = false;
          if (typeof e === 'string' && e.indexOf('connection authorization') !== -1) {
            e = error('AUTHORIZATION', 'Invalid API Key');
            try {
              socketObj.disconnect();
            } catch (e) {
              try {
                socketObj.close();
              } catch (e) {
              }
            }
          }
          this.emit('disconnect', e);
        });
    }

    let self = this;
    return new Promise((resolve, reject) => {
      self.once('connect', resolve);
      self.once('disconnect', reject);
    });
  }
}

function error(code, message) {
  let e = new Error(message);
  e.code = code;
  return e;
}

function parseError(e) {
  let err;
  if (typeof e === 'object' && e) {
    if (e instanceof Error) {
      err = e;
    } else {
      err = new Error(e.message || 'Failed to complete fetch request.');
    }
  } else {
    e = {};
    err = new Error(e.message || 'Failed to complete fetch request');
  }
  Object.keys(e).forEach((key) => {
    err[key] = e[key];
  });
  if (!err.code) err.code = 'SERVER_ERROR';
  if (!err.status) err.status = 500;
  return err;
}

module.exports = UIAMPClient;
