dc.pieChart = function(selector, hierarchical) {
    var sliceCssClass = "pie-slice";

    var radius = 0, innerRadius = 0;

    var g;

    var arc;
    var dataPie;
    var dataPieDimension;
    var slices;
    var slicePaths;

    var labels;

    var chart = dc.singleSelectionChart(dc.colorChart(dc.baseChart({})), hierarchical);

    chart.label(function(d) {
        return chart.valuePrinter()(chart.keyRetriever()(d.data));
    });
    chart.renderLabel(true);

    chart.title(function(d) {
        return chart.valuePrinter()(d.data.key) + ": " + chart.valuePrinter()(d.data.value);
    });

    chart.transitionDuration(350);

    chart.render = function() {
        chart.resetSvg();

        if (chart.dataAreSet()) {
            g = chart.svg()
                .append("g")
                .attr("transform", "translate(" + chart.cx() + "," + chart.cy() + ")");

            dataPie = calculateDataPie();
            dataPieDimension = chart.dimension();

            arc = chart.buildArcs();

            slices = chart.drawSlices(g, dataPie, arc);

            chart.drawLabels(slices, arc);
            chart.drawTitles(slices, arc);

            chart.highlightFilter();
        }

        return chart;
    };

    chart.innerRadius = function(r) {
        if (!arguments.length) return innerRadius;
        innerRadius = r;
        return chart;
    };

    chart.radius = function(r) {
        if (!arguments.length) return radius;
        radius = r;
        return chart;
    };

    chart.cx = function() {
        return chart.width() / 2;
    };

    chart.cy = function() {
        return chart.height() / 2;
    };

    chart.buildArcs = function() {
        return d3.svg.arc().outerRadius(radius).innerRadius(innerRadius);
    };

    chart.drawSlices = function(topG, dataPie, arcs) {
        slices = topG.selectAll("g." + sliceCssClass)
            .data(dataPie(chart.orderedGroup().top(Infinity)))
            .enter()
            .append("g")
            .attr("class", function(d, i) {
                return sliceCssClass + " " + i;
            });

        slicePaths = slices.append("path")
            .attr("fill", function(d, i) {
                return chart.colors()(i);
            })
            .attr("d", arcs);

        slicePaths
            .transition()
            .duration(chart.transitionDuration())
            .attrTween("d", tweenPie);

        slicePaths.on("click", onClick);

        return slices;
    };

    chart.drawLabels = function(slices, arc) {
        if (chart.renderLabel()) {
            labels = slices.append("text");
            redrawLabels(arc);
            labels.on("click", onClick);
        }
    };

    chart.drawTitles = function(slices, arc) {
        if (chart.renderTitle()) {
            slices.append("title").text(function(d) {
                return chart.title()(d);
            });
        }
    };

    chart.highlightFilter = function() {
        if (chart.hasFilter()) {
            chart.selectAll("g." + sliceCssClass).select("path").each(function(d) {
                if (chart.isSelectedSlice(d)) {
                    chart.highlightSelected(this);
                } else {
                    chart.fadeDeselected(this);
                }
            });
        } else {
            chart.selectAll("g." + sliceCssClass).selectAll("path").each(function(d) {
                chart.resetHighlight(this);
            });
        }
    };

    chart.isSelectedSlice = function(d) {
        return chart.filter() == chart.keyRetriever()(d.data);
    };

    chart.redraw = function() {
    	if ( dataPieDimension !== chart.dimension() )
    		return chart.render();
        chart.highlightFilter();
        var data = dataPie(chart.orderedGroup().top(Infinity));
        slicePaths = slicePaths.data(data);
        labels = labels.data(data);
        dc.transition(slicePaths, chart.transitionDuration(), function(s) {
            s.attrTween("d", tweenPie);
        });
        redrawLabels(arc);
        redrawTitles();
        return chart;
    };

    function calculateDataPie() {
        return d3.layout.pie().value(function(d) {
            return chart.valueRetriever()(d);
        });
    }

    function redrawLabels(arc) {
        dc.transition(labels, chart.transitionDuration())
            .attr("transform", function(d) {
                d.innerRadius = chart.innerRadius();
                d.outerRadius = radius;
                var centroid = arc.centroid(d);
                if (isNaN(centroid[0]) || isNaN(centroid[1])) {
                    return "translate(0,0)";
                } else {
                    return "translate(" + centroid + ")";
                }
            })
            .attr("text-anchor", "middle")
            .text(function(d) {
                var data = d.data;
                if (chart.valueRetriever()(data) == 0)
                    return "";
                return chart.label()(d);
            });
    }

    function redrawTitles() {
        if (chart.renderTitle()) {
            slices.selectAll("title").text(function(d) {
                return chart.title()(d);
            });
        }
    }

    function tweenPie(b) {
        b.innerRadius = chart.innerRadius();
        var current = this._current;
        if (isOffCanvas(current))
            current = {startAngle: 0, endAngle: 0};
        var i = d3.interpolate(current, b);
        this._current = i(0);
        return function(t) {
            return arc(i(t));
        };
    }

    function isOffCanvas(current) {
        return current == null || isNaN(current.startAngle) || isNaN(current.endAngle);
    }

    function onClick(d) {
        chart.filter(chart.keyRetriever()(d.data));
        dc.redrawAll();
    }

    return chart.anchor(selector);
};
