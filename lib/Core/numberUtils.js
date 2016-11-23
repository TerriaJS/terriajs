'use strict';

function isInteger(value) {
  return !isNaN(value) && parseInt(Number(value), 10) === value && !isNaN(parseInt(value, 10));
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function compareStringsAndNumbers(a, b) {
	if (isNumeric(a) && isNumeric(b)) {
		return a - b;
	}
	return a > b ? 1 : a < b ? -1 : 0;
}

module.exports = {isInteger, isNumeric, compareStringsAndNumbers};