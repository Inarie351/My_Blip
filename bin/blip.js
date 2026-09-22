#!/usr/bin/env node

const { createProgram } = require('../src/cli');

createProgram().parse(process.argv);
