dc.baseChart = function(chart) {
    var _dimension;
    var _group;

    var _anchor;
    var _root;
    var _svg;

    var width = 200, height = 200;

    var _keyRetriever = function(d) {
        return d.key;
    };
    var _valueRetriever = function(d) {
        return d.value;
    };

    var _label = function(d) {
        return dc.printers.value(d.key);
    };
    var _renderLabel = false;

    var _title = function(d) {
        return dc.printers.value(d.key) + ": " + dc.printers.value(d.value);
    };
    var _renderTitle = false;

    var _transitionDuration = 750;

    var _filterPrinter = dc.printers.filter;
    
    var _valuePrinter = dc.printers.value;

    chart.dimension = function(d) {
        if (!arguments.length) return _dimension;
        _dimension = d;
        return chart;
    };

    chart.group = function(g) {
        if (!arguments.length) return _group;
        _group = g;
        return chart;
    };

    chart.orderedGroup = function() {
        return chart.group().order(function(p) {
            return p.key;
        });
    };

    chart.filterAll = function() {
        return chart.filter(null);
    };

    chart.dataAreSet = function() {
        return chart.dimension() != undefined && chart.group() != undefined;
    };

    chart.select = function(s) {
        return _root.select(s);
    };

    chart.selectAll = function(s) {
        return _root.selectAll(s);
    };

    chart.anchor = function(a) {
        if (!arguments.length) return _anchor;
        if (a instanceof Object) {
            _anchor = a.anchor();
            _root = a.root();
        } else {
            _anchor = a;
            _root = d3.select(_anchor);
            dc.registerChart(chart);
        }
        return chart;
    };

    chart.root = function(r) {
        if (!arguments.length) return _root;
        _root = r;
        return chart;
    };

    chart.width = function(w) {
        if (!arguments.length) return width;
        width = w;
        return chart;
    };

    chart.height = function(h) {
        if (!arguments.length) return height;
        height = h;
        return chart;
    };

    chart.svg = function(_) {
        if (!arguments.length) return _svg;
        _svg = _;
        return chart;
    };

    chart.resetSvg = function() {
        chart.select("svg").remove();
        return chart.generateSvg();
    };

    chart.generateSvg = function() {
        _svg = chart.root().append("svg")
            .attr("width", chart.width())
            .attr("height", chart.height());
        return _svg;
    };

    chart.valuePrinter = function(_){
        if(!arguments.length) return _valuePrinter;
        _valuePrinter = _;
        return chart;
    };

    chart.filterPrinter = function(_){
        if(!arguments.length) return _filterPrinter;
        _filterPrinter = _;
        return chart;
    };
    
    chart.filterText = function() {
    	return chart.filterPrinter()(chart.filter());
    };

    chart.turnOnControls = function() {
        chart.select("a.reset").style("display", null);
        chart.select(".filter").text(chart.filterText()).style("display", null);
    };

    chart.turnOffControls = function() {
        chart.select("a.reset").style("display", "none");
        chart.select(".filter").style("display", "none").text(chart.filterText());
    };

    chart.transitionDuration = function(d) {
        if (!arguments.length) return _transitionDuration;
        _transitionDuration = d;
        return chart;
    };

    // abstract function stub
    chart.filter = function(f) {
        // do nothing in base, should be overridden by sub-function
        return chart;
    };

    chart.render = function() {
        // do nothing in base, should be overridden by sub-function
        return chart;
    };

    chart.redraw = function() {
        // do nothing in base, should be overridden by sub-function
        return chart;
    };

    chart.keyRetriever = function(_) {
        if (!arguments.length) return _keyRetriever;
        _keyRetriever = _;
        return chart;
    };

    chart.valueRetriever = function(_) {
        if (!arguments.length) return _valueRetriever;
        _valueRetriever = _;
        return chart;
    };

    chart.label = function(_) {
        if (!arguments.length) return _label;
        _label = _;
        _renderLabel = true;
        return chart;
    };

    chart.renderLabel = function(_) {
        if (!arguments.length) return _renderLabel;
        _renderLabel = _;
        return chart;
    };

    chart.title = function(_) {
        if (!arguments.length) return _title;
        _title = _;
        _renderTitle = true;
        return chart;
    };

    chart.renderTitle = function(_) {
        if (!arguments.length) return _renderTitle;
        _renderTitle = _;
        return chart;
    };

    return chart;
};
