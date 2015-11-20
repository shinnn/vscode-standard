'use strict';

const path = require('path');

const langClient = require('vscode-languageclient');
const LanguageClient = langClient.LanguageClient;
const SettingMonitor = langClient.SettingMonitor;
const vscode = require('vscode');

exports.activate = function activateStandard(context) {
  const serverModule = path.join(__dirname, 'server.js');

  const client = new LanguageClient('Standard Linter', {
    run: {
      module: serverModule
    },
    debug: {
      module: serverModule,
      options: {
        execArgv: ['--nolazy', '--debug=6004']
      }
    }
  }, {
    documentSelector: ['javascript'],
    synchronize: {
      configurationSection: 'standard',
      fileEvents: vscode.workspace.createFileSystemWatcher('package.json')
    }
  });

  context.subscriptions.push(new SettingMonitor(client, 'standard.enable').start());
};
