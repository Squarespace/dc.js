dc.coordinateGridChart = function(chart) {
    var DEFAULT_Y_AXIS_TICKS = 5;

    chart = dc.baseChart(chart);

    var _margin = {top: 10, right: 50, bottom: 30, left: 20};

    var _g;

    var _x;
    var _xAxis = d3.svg.axis();
    var _xUnits = dc.units.integers;

    var _y;
    var _yAxis = d3.svg.axis();
    var _yElasticity = false;

    var _filter;
    var _brush = d3.svg.brush();
    var _round;

    chart.generateG = function() {
        _g = chart.svg().append("g")
            .attr("transform", "translate(" + chart.margins().left + "," + chart.margins().top + ")");
        return _g;
    };

    chart.g = function(_) {
        if (!arguments.length) return _g;
        _g = _;
        return chart;
    };

    chart.margins = function(m) {
        if (!arguments.length) return _margin;
        _margin = m;
        return chart;
    };

    chart.x = function(_) {
        if (!arguments.length) return _x;
        _x = _;
        return chart;
    };

    chart.xAxis = function(_) {
        if (!arguments.length) return _xAxis;
        _xAxis = _;
        return chart;
    };

    chart.renderXAxis = function(g) {
        g.select("g.x").remove();
        _x.range([0, chart.xAxisLength()]);
        _xAxis = _xAxis.scale(chart.x()).orient("bottom");
        g.append("g")
            .attr("class", "axis x")
            .attr("transform", "translate(" + chart.margins().left + "," + chart.xAxisY() + ")")
            .call(_xAxis);
    };

    chart.xAxisY = function() {
        return (chart.height() - chart.margins().bottom);
    };

    chart.xAxisLength = function() {
        return chart.width() - chart.margins().left - chart.margins().right;
    };

    chart.xUnits = function(_) {
        if (!arguments.length) return _xUnits;
        _xUnits = _;
        return chart;
    };

    chart.renderYAxis = function(g) {
        g.select("g.y").remove();

        if (_y == null || chart.elasticY()) {
            _y = d3.scale.linear();
            _y.domain([chart.yAxisMin(), chart.yAxisMax()]).rangeRound([chart.yAxisHeight(), 0]);
        }

        _y.range([chart.yAxisHeight(), 0]);
        _yAxis = _yAxis.scale(_y).orient("left").ticks(DEFAULT_Y_AXIS_TICKS);

        g.append("g")
            .attr("class", "axis y")
            .attr("transform", "translate(" + chart.margins().left + "," + chart.margins().top + ")")
            .call(_yAxis);
    };

    chart.y = function(_) {
        if (!arguments.length) return _y;
        _y = _;
        return chart;
    };

    chart.yAxis = function(y) {
        if (!arguments.length) return _yAxis;
        _yAxis = y;
        return chart;
    };

    chart.elasticY = function(_) {
        if (!arguments.length) return _yElasticity;
        _yElasticity = _;
        return chart;
    };

    chart.yAxisMin = function() {
        var min = d3.min(chart.group().all(), function(e) {
            return chart.valueRetriever()(e);
        });
        if (min > 0) min = 0;
        return min;
    };

    chart.yAxisMax = function() {
        return d3.max(chart.group().all(), function(e) {
            return e.key == null ? 0 : chart.valueRetriever()(e);
        });
    };

    chart.yAxisHeight = function() {
        return chart.height() - chart.margins().top - chart.margins().bottom;
    };

    chart.round = function(_) {
        if (!arguments.length) return _round;
        _round = _;
        return chart;
    };

    chart._filter = function(_) {
        if (!arguments.length) return _filter;
        _filter = _;
        return chart;
    };

    chart.filter = function(_) {
        if (!arguments.length) return _filter;

        if (_) {
            _filter = _;
            chart.brush().extent(_);
            chart.dimension().filterRange(_);
            chart.turnOnControls();
        } else {
            _filter = null;
            chart.brush().clear();
            chart.dimension().filterAll();
            chart.turnOffControls();
        }

        return chart;
    };

    chart.brush = function(_) {
        if (!arguments.length) return _brush;
        _brush = _;
        return chart;
    };

    chart.renderBrush = function(g) {
        _brush.on("brushstart", brushStart)
            .on("brush", brushing)
            .on("brushend", brushEnd);

        var gBrush = g.append("g")
            .attr("class", "brush")
            .attr("transform", "translate(" + chart.margins().left + ",0)")
            .call(_brush.x(chart.x()));
        gBrush.selectAll("rect").attr("height", chart.xAxisY());
        gBrush.selectAll(".resize").append("path").attr("d", chart.resizeHandlePath);

        if (_filter) {
            chart.redrawBrush(g);
        }
    };

    function brushStart(p) {
    }

    function brushing(p) {
        var extent = _brush.extent();
        if (chart.round()) {
            extent[0] = extent.map(chart.round())[0];
            extent[1] = extent.map(chart.round())[1];
            _g.select(".brush")
                .call(_brush.extent(extent));
        }
        extent = _brush.extent();
        chart.filter(_brush.empty() ? null : [extent[0], extent[1]]);
        dc.redrawAll();
    }

    function brushEnd(p) {
    }

    chart.redrawBrush = function(g) {
        if (chart._filter() && chart.brush().empty())
            chart.brush().extent(chart._filter());

        var gBrush = g.select("g.brush");
        gBrush.call(chart.brush().x(chart.x()));
        gBrush.selectAll("rect").attr("height", chart.xAxisY());

        chart.fadeDeselectedArea();
    };

    chart.fadeDeselectedArea = function(){
        // do nothing, sub-chart should override this function
    };

    // borrowed from Crossfilter example
    chart.resizeHandlePath = function(d) {
        var e = +(d == "e"), x = e ? 1 : -1, y = chart.xAxisY() / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
    };

    chart.render = function() {
        chart.resetSvg();

        if (chart.dataAreSet()) {
            chart.generateG();

            chart.renderXAxis(chart.g());
            chart.renderYAxis(chart.g());

            chart.plotData();

            chart.renderBrush(chart.g());
        }

        return chart;
    };

    chart.redraw = function() {
        if (chart.elasticY())
            chart.renderYAxis(chart.g());

        chart.plotData();
        chart.redrawBrush(chart.g());

        return chart;
    };

    chart.subRender = function(){
        if (chart.dataAreSet()) {
            chart.plotData();
        }

        return chart;
    };

    return chart;
};
