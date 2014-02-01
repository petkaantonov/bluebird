var runner = mocha.run();
(function() {
    var start = new Date();
    var lastTests = 0;
    var checker = setInterval(function() {
        var root = document.getElementById("mocha-stats");
        var li = root.getElementsByTagName("li");
        var passes, failures;
        for(var j = 0; j < li.length; ++j) {
            if (li[j].className === "passes") {
                var elem = li[j].getElementsByTagName("em")[0];
                passes = parseInt(elem.innerText || elem.textContent, 10);
            }
            else if (li[j].className === "failures") {
                var elem = li[j].getElementsByTagName("em")[0];
                failures = parseInt(elem.innerText || elem.textContent, 10);
            }
        }
        var tests = passes + failures;

        if (!window.mochaResults && tests === lastTests &&
            tests > 0 && lastTests > 0) {
            var end = new Date();
            var stats = {
                duration: +end - +start,
                end: end,
                start: start,
                suites: (tests / 2) | 0,
                tests: tests,
                pending: 0,
                failures: failures,
                passes: passes
            };
            window.mochaResults = stats;
        }

        lastTests = tests;
    }, 1000);

})();
