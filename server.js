'use strict';

const path = require('path');

const langServer = require('vscode-languageserver');
const noop = require('nop');
const eslint = require('eslint');
const StandardEngine = require('standard-engine').linter;

const standard = new StandardEngine({
  eslint,
  eslintConfig: {
    configFile: path.join(__dirname, 'config.js')
  }
});

let options;

const connection = langServer.createConnection(process.stdin, process.stdout);
const documents = new langServer.TextDocuments();

function parseSeverity(severity) {
  if (severity === 2) {
    return 1;
  }

  return 2;
}

function makeDiagnostic(problem) {
  return {
    message: `Standard: ${problem.message} (${problem.ruleId})`,
    severity: parseSeverity(problem.severity),
    range: {
      start: {line: problem.line - 1, character: problem.column - 1},
      end: {line: problem.line - 1, character: problem.column - 1}
    }
  };
}

function getMessage(err, document) {
  if (typeof err.message === 'string') {
    return err.message;
  }

  return 'An unknown error occurred while validating file:' +
         langServer.Files.uriToFilePath(document.uri);
}

function validate(document) {
  const uri = document.uri;

  standard.lintText(document.getText(), options, (err, report) => {
    if (err) {
      connection.window.showErrorMessage(getMessage(err, document));
      return;
    }

    const diagnostics = [];

    report.results.forEach(result => {
      result.messages.forEach(message => diagnostics.push(makeDiagnostic(message)));
    });

    connection.sendDiagnostics({uri, diagnostics});
  });
}

function validateAll() {
  documents.all().forEach(document => validate(document));
}

connection.onInitialize(noop);
connection.onDidChangeConfiguration(params => {
  const settings = params.settings;

  options = settings.standard ? settings.standard.options || {} : {};
  validateAll();
});
connection.onDidChangeWatchedFiles(() => validateAll());

documents.onDidChangeContent(event => validate(event.document));
documents.listen(connection);

connection.listen();
