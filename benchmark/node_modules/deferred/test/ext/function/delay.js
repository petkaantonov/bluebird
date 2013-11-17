'use strict';

module.exports = function (t, a, d) {
	var x = {}, y = {}, z = {}, p, r;
	t.call(function (arg1, arg2) {
		return [this, arg1, arg2];
	}, 100).call(x, y, z)(function (arg) {
		p = y;
		r = arg;
	}).end();
	a.not(p, y, "Not yet");
	setTimeout(function () {
		a.not(p, y, "After a while");
		setTimeout(function () {
			a(p, y, "Timed");
			a.deep(r, [x, y, z], "Result");
			d();
		}, 70);
	}, 50);
};
