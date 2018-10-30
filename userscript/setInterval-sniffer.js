// ==UserScript==
// @name         setInterval sniffer
// @namespace    https://github.com/martianyi/setInterval-sniffer
// @version      0.1
// @description  Keep tabs on your uncleared intervals. Hunt down lags and memory leaks.
// @author       NV, martianyi
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var originalSetInterval = window.setInterval;
  var originalClearInterval = window.clearInterval;
  // TODO: track setTimeout too, but separate it visually from setInterval
  var originalSetTimeout = window.setTimeout;
  var originalClearTimeout = window.clearTimeout;
  var debugPanel = null;
  var startBtn = null;

  function constructId(name, id) {
    return name + '_' + id;
  }

  function log(data) {
    if (data.functionName === 'setTimeout' || data.functionName === 'setInterval') {
      var div = document.createElement('div');
      div.setAttribute('style',
        'padding: 2px 8px;' +
        'border-left: 3px solid #C967D1;'
      );
      var name = data.functionName === 'setTimeout' ? 'timeout' : 'interval';
      div.id = constructId(name, data.id);
      div.textContent = data.functionName + '(' + data.fn + ', ' + data.time + ') -> ' + data.id;
      var out = document.getElementById('out');
      out.appendChild(div);

      if (data.functionName === 'setTimeout') {
        originalSetTimeout(function () {
          div.style.color = '#eee';
          div.style.fontSize = '10px';
        }, data.time);
      }

    } else {
      var name = data.functionName === 'clearTimeout' ? 'timeout' : 'interval';
      var div = document.getElementById(constructId(name, data.id));
      if (div) {
        div.style.color = '#eee';
        div.style.fontSize = '10px';
      } else {
        console.warn('%i is not captured', data.id);
      }
    }
  }


  function enable() {
    startBtn.style.display = 'none';
    debugPanel = document.createElement('div');
    debugPanel.setAttribute('style',
      'position: fixed;' +
      'top: 10px;' +
      'right: 10px;' +
      'z-index: 9999;' +
      'width: 400px;' +
      'height: 300px;' +
      'background: rgba(28,28,28,0.8);' +
      'border-radius: 4px;' +
      'color: #fff;'
    );
    var out = document.createElement('div');
    out.setAttribute('style',
      'white-space: pre-wrap; ' +
      'width: 390px;' +
      'height: 290px;' +
      'padding: 5px;' +
      'tab-size: 2;' +
      'font: 11px monospace;' +
      'overflow: scroll;'
    );
    out.setAttribute('id', 'out');
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '[x]';
    closeBtn.addEventListener('click', disable);
    closeBtn.setAttribute('style',
      'position: absolute;' +
      'top: 0;' +
      'right: 0;' +
      'outline: 0;' +
      'border: none;' +
      'background: transparent;' +
      'color: #fff;' +
      'cursor: pointer;'
    );
    debugPanel.appendChild(closeBtn);
    debugPanel.appendChild(out);
    document.body.appendChild(debugPanel);

    window.setInterval = function (fn, time) {
      var id = originalSetInterval(fn, time);
      log({
        functionName: 'setInterval',
        fn: fn.toString(),
        id: id,
        time: time
      });
      return id;
    };

    window.clearInterval = function (id) {
      var result = originalClearInterval(id);
      log({
        functionName: 'clearInterval',
        id: id
      });
      return result;
    };

    window.setTimeout = function (fn, time) {
      var id = originalSetTimeout(fn, time);
      log({
        functionName: 'setTimeout',
        fn: fn.toString(),
        id: id,
        time: time
      });
      return id;
    };

    window.clearTimeout = function (id) {
      var result = originalClearTimeout(id);
      log({
        functionName: 'clearTimeout',
        id: id
      });
      return result;
    };
  }


  function disable() {
    startBtn.style.display = 'block';
    document.body.removeChild(debugPanel);
    window.setInterval = originalSetInterval;
    window.clearInterval = originalClearInterval;
    window.setTimeout = originalSetTimeout;
    window.clearTimeout = originalClearTimeout;
  }


  // TODO: log file names and line numbers
  function prepareStack(constructor) {
    var _Error_prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (error, stack) {
      return stack;
    };
    var error = new Error();
    Error.captureStackTrace(error, constructor);
    Error.prepareStackTrace = _Error_prepareStackTrace;
    var stack = prettyStackTrace(error.stack);
    stack.unshift({
      isTop: true,
      functionName: constructor.name,
      data: Date.now()
    });
    return stack;
  }

  function prettyStackTrace(callSites) {
    var result = [];
    for (var i = 0; i < callSites.length; i++) {
      var item = callSites[i];
      var fn = item.getFunction();
      var last = {
        function: fn.toString() || '',
        args: [].slice.call(fn.arguments, 0),
        methodName: item.getMethodName() || '',
        functionName: item.getFunctionName() || '',
        name: fn.name,
        fileName: item.getFileName() || (item.isEval() ? item.getEvalOrigin() : item.isNative() ? 'native' : 'unknown'),
        lineNumber: item.getLineNumber() - 1,
        columnNumber: item.getColumnNumber()
      };
      result.push(last);
      if (!last.fileName) {
        debugger;
      }
    }
    return result;
  }

  startBtn = document.createElement('button');
  startBtn.textContent = 'setInterval Sniffer';
  startBtn.setAttribute('style',
    'all: unset;' +
    'position: fixed;' +
    'top: 10px;' +
    'right: 10px;' +
    'z-index: 9999;' +
    'width: 125px;' +
    'height: 30px;' +
    'background: rgba(28,28,28,0.8);' +
    'border-radius: 4px;' +
    'color: #fff;' +
    'outline: none;' +
    'border: none;' +
    'cursor: pointer;' +
    'text-align: center;' +
    'font: 11px;'
  );
  startBtn.addEventListener('click', enable);
  document.body.appendChild(startBtn);


})();
