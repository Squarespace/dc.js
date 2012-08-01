dc = {
    version: "0.6.0",
    _charts: []
};

dc.registerChart = function(chart) {
    dc._charts.push(chart);
};

dc.hasChart = function(chart) {
    return dc._charts.indexOf(chart) >= 0;
};

dc.deregisterAllCharts = function() {
    dc._charts = [];
};

dc.filterAll = function() {
    for (var i = 0; i < dc._charts.length; ++i) {
        dc._charts[i].filterAll();
    }
};

dc.renderAll = function() {
    for (var i = 0; i < dc._charts.length; ++i) {
        dc._charts[i].render();
    }
};

dc.redrawAll = function() {
    for (var i = 0; i < dc._charts.length; ++i) {
        dc._charts[i].redraw();
    }
};

dc.transition = function(selections, duration, callback) {
    if (duration <= 0)
        return selections;

    var s = selections
        .transition()
        .duration(duration);

    if (callback instanceof Function) {
        callback(s);
    }

    return s;
};

dc.units = {};

dc.units.integers = function(s, e) {
    return new Array(Math.abs(e - s));
};

dc.round = {};

dc.round.floor = function(n) {
    return Math.floor(n);
};

dc.override = function(obj, functionName, newFunction) {
    var existingFunction = obj[functionName];
    newFunction._ = existingFunction;
    obj[functionName] = function() {
        return newFunction(existingFunction);
    };
}
dc.dateFormat= d3.time.format("%m/%d/%Y");

dc.printers = {};

dc.printers.filter = function(filter) {
    var s = "";

    if (filter) {
        if (filter instanceof Array) {
            if (filter.length >= 2)
                s = "[" + printSingleValue(filter[0]) + " -> " + printSingleValue(filter[1]) + "]";
            else if (filter.length >= 1)
                s = printSingleValue(filter[0]);
        } else {
            s = printSingleValue(filter)
        }
    }

    return s;
};

function printSingleValue(filter) {
    var s = "" + filter;

    if (filter instanceof Date)
        s = dc.dateFormat(filter);
    else if(typeof(filter) == "string")
        s = filter;
    else if(typeof(filter) == "number")
        s = Math.round(filter);

    return s;
}
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
        return d.key;
    };
    var _renderLabel = false;

    var _title = function(d) {
        return d.key + ": " + d.value;
    };
    var _renderTitle = false;

    var _transitionDuration = 750;

    var _filterPrinter = dc.printers.filter;

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
            return chart.valueRetriever()(e);
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
dc.colorChart = function(chart) {
    var _colors = d3.scale.category20c();

    chart.colors = function(_) {
        if (!arguments.length) return _colors;

        if(_ instanceof Array)
            _colors = d3.scale.ordinal().range(_);
        else
            _colors = _;

        return chart;
    };

    return chart;
};
dc.singleSelectionChart = function(chart, hierarchical) {
	var SELECTED_CLASS = "selected";
	var DESELECTED_CLASS = "deselected";

	chart.highlightSelected = function(e) {
		d3.select(e).classed(SELECTED_CLASS, true);
		d3.select(e).classed(DESELECTED_CLASS, false);
	};

	chart.fadeDeselected = function(e) {
		d3.select(e).classed(SELECTED_CLASS, false);
		d3.select(e).classed(DESELECTED_CLASS, true);
	};

	chart.resetHighlight = function(e) {
		d3.select(e).classed(SELECTED_CLASS, false);
		d3.select(e).classed(DESELECTED_CLASS, false);
	};

	// Non-hierarchical chart, the default type, has simple filter as other
	// chart types do.
	if (!hierarchical) {
		var _filter = null;

		chart.hasFilter = function() {
			return _filter != null;
		};

		chart.filter = function(f) {
			if (!arguments.length)
				return _filter;

			_filter = f;

			if (chart.dataAreSet())
				chart.dimension().filter(_filter);

			if (f) {
				chart.turnOnControls();
			} else {
				chart.turnOffControls();
			}

			return chart;
		};
	}
	// hierarchical charts have an array of filters, dimensions, and groups.
	else {
		var _dimensions = [];
		var _groups = [];
		var _filters = [];

		var _latestFilter = function() {
			return _filters.length > 0 ? _filters[_filters.length - 1] : null;
		};

		chart.filterText = function() {
			var strings = new Array();
			for ( var i = 0; i < _filters.length; i++) {
				strings.push(chart.filterPrinter()(_filters[i]));
			}
			return strings.join(" >> ");
		};

		chart.hasFilter = function() {
			return _filters.length == _dimensions.length;
		};

		chart.filter = function(f) {
			if (!arguments.length)
				return _latestFilter();

			if (f != undefined) {
				if (chart.dataAreSet())
					chart.dimension().filter(f);
				if (_filters.length < _dimensions.length) {
					_filters.push(f);
				} else
					_filters[_filters.length - 1] = f;
			} else {
				var dim = chart.dimension();
				if (chart.dataAreSet())
					dim.filter(f);
				if (_filters.length > 0) {
					_filters.pop();
				}
			}

			if (_filters.length > 0) {
				chart.turnOnControls();
			} else {
				chart.turnOffControls();
			}

			return chart;
		};

		chart.popFilter = function() {
			chart.filter(null);
			return chart;
		};

		chart.filterAll = function() {
			while (_filters.length > 0) {
				chart.filter(null);
			}
			chart.dimension().filter(null);
		};

		chart.dimension = function() {
			if (arguments.length) {
				throw "Cannot call dimension() with argument, must call addDimensionAndGroup(d, g)";
			}
			return (_dimensions.length == 0) ? null : _dimensions[Math.min(
					_filters.length, _dimensions.length - 1)];
		};

		chart.group = function() {
			if (arguments.length) {
				throw "Cannot call group() with argument, must call addDimensionAndGroup(d, g)";
			}
			return (_groups.length == 0) ? null : _groups[Math.min(
					_filters.length, _groups.length - 1)];
		};

		chart.addDimensionAndGroup = function(d, g) {
			_dimensions.push(d);
			_groups.push(g);
			return chart;
		};

	}

	return chart;
};
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
        return chart.keyRetriever()(d.data);
    });
    chart.renderLabel(true);

    chart.title(function(d) {
        return d.data.key + ": " + d.data.value;
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
dc.barChart = function(parent) {
    var MIN_BAR_WIDTH = 1;
    var MIN_BAR_HEIGHT = 0;
    var BAR_PADDING_BOTTOM = 1;
    var BAR_PADDING_WIDTH = 2;
    var GROUP_INDEX_NAME = "__group_index__";

    var _stack = [];
    var _barPositionMatrix = [];

    var chart = dc.coordinateGridChart({});

    chart.transitionDuration(500);

    chart.plotData = function() {
        var groups = combineAllGroups();

        precalculateBarPosition(groups);

        for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
            var group = groups[groupIndex];

            var bars = chart.g().selectAll("rect.stack" + groupIndex)
                .data(group.all());

            // new
            bars.enter()
                .append("rect")
                .attr("class", "bar stack" + groupIndex)
                .attr("x", function(data, dataIndex){return barX(this, data, groupIndex, dataIndex);})
                .attr("y", chart.xAxisY())
                .attr("width", barWidth);
            dc.transition(bars, chart.transitionDuration())
                .attr("y", function(data, dataIndex) {
                    return barY(this, data, dataIndex);
                })
                .attr("height", barHeight);

            // update
            dc.transition(bars, chart.transitionDuration())
                .attr("y", function(data, dataIndex) {
                    return barY(this, data, dataIndex);
                })
                .attr("height", barHeight);

            // delete
            dc.transition(bars.exit(), chart.transitionDuration())
                .attr("y", chart.xAxisY())
                .attr("height", 0);
        }
    };

    function precalculateBarPosition(groups) {
        for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
            var data = groups[groupIndex].all();
            _barPositionMatrix[groupIndex] = [];
            for (var dataIndex = 0; dataIndex < data.length; ++dataIndex) {
                var d = data[dataIndex];
                if (groupIndex == 0)
                    _barPositionMatrix[groupIndex][dataIndex] = barBaseline() - barHeight(d);
                else
                    _barPositionMatrix[groupIndex][dataIndex] = _barPositionMatrix[groupIndex - 1][dataIndex] - barHeight(d);
            }
        }
    }

    function barBaseline() {
        return chart.margins().top + chart.yAxisHeight() - BAR_PADDING_BOTTOM;
    }

    function barWidth(d) {
        var numberOfBars = chart.xUnits()(chart.x().domain()[0], chart.x().domain()[1]).length + BAR_PADDING_WIDTH;
        var w = Math.floor(chart.xAxisLength() / numberOfBars);
        if (isNaN(w) || w < MIN_BAR_WIDTH)
            w = MIN_BAR_WIDTH;
        return w;
    }

    function barX(bar, data, groupIndex, dataIndex) {
        // cache group index in each individual bar to avoid timing issue introduced by transition
        bar[GROUP_INDEX_NAME] = groupIndex;
        return chart.x()(chart.keyRetriever()(data)) + chart.margins().left;
    }

    function barY(bar, data, dataIndex) {
        // cached group index can then be safely retrieved from bar wo/ worrying about transition
        var groupIndex = bar[GROUP_INDEX_NAME];
        return _barPositionMatrix[groupIndex][dataIndex];
    }

    function barHeight(d) {
        var h = (chart.yAxisHeight() - chart.y()(chart.valueRetriever()(d)) - BAR_PADDING_BOTTOM);
	if ( isNaN(h) || h < MIN_BAR_HEIGHT ) 
	    h = MIN_BAR_HEIGHT;
	return h;
    }

    chart.fadeDeselectedArea = function() {
        var bars = chart.g().selectAll("rect.bar");

        if (!chart.brush().empty() && chart.brush().extent() != null) {
            var start = chart.brush().extent()[0];
            var end = chart.brush().extent()[1];

            bars.classed("deselected", function(d) {
                var xValue = chart.keyRetriever()(d);
                return xValue < start || xValue >= end;
            });
        } else {
            bars.classed("deselected", false);
        }
    };

    chart.stack = function(_) {
        if (!arguments.length) return _stack;
        _stack = _;
        return chart;
    };

    // override y axis domain calculation to include stacked groups
    function combineAllGroups() {
        var allGroups = [];

        allGroups.push(chart.group());

        for (var i = 0; i < chart.stack().length; ++i)
            allGroups.push(chart.stack()[i]);

        return allGroups;
    }

    chart.yAxisMin = function() {
        var min = 0;
        var allGroups = combineAllGroups();

        for (var i = 0; i < allGroups.length; ++i) {
            var group = allGroups[i];
            var m = d3.min(group.all(), function(e) {
                return chart.valueRetriever()(e);
            });
            if (m < min) min = m;
        }

        return min;
    };

    chart.yAxisMax = function() {
        var max = 0;
        var allGroups = combineAllGroups();

        for (var i = 0; i < allGroups.length; ++i) {
            var group = allGroups[i];
            max += d3.max(group.all(), function(e) {
                return chart.valueRetriever()(e);
            });
        }

        return max;
    };

    return chart.anchor(parent);
};
dc.lineChart = function(parent) {
    var chart = dc.coordinateGridChart({});

    chart.transitionDuration(500);

    chart.plotData = function() {
        chart.g().datum(chart.group().all());

        var path = chart.g().selectAll("path.line");

        if (path.empty())
            path = chart.g().append("path")
                .attr("class", "line");

        var line = d3.svg.line()
            .x(function(d) {
                return chart.x()(chart.keyRetriever()(d));
            })
            .y(function(d) {
                return chart.y()(chart.valueRetriever()(d));
            });

        path = path
            .attr("transform", "translate(" + chart.margins().left + "," + chart.margins().top + ")");

        dc.transition(path, chart.transitionDuration(), function(t) {
            t.ease("linear")
        }).attr("d", line);
    };

    return chart.anchor(parent);
};
dc.dataCount = function(selector) {
    var formatNumber = d3.format(",d");
    var chart = dc.baseChart({});

    chart.render = function() {
        chart.selectAll(".total-count").text(formatNumber(chart.dimension().size()));
        chart.selectAll(".filter-count").text(formatNumber(chart.group().value()));

        return chart;
    };

    chart.redraw = function(){
        return chart.render();
    };

    return chart.anchor(selector);
};
dc.dataTable = function(selector) {
    var chart = dc.baseChart({});

    var size = 25;
    var columns = [];
    var sortBy = function(d) {
        return d;
    };
    var order = d3.ascending;
    var sort;

    chart.render = function() {
        chart.selectAll("div.row").remove();

        renderRows(renderGroups());

        return chart;
    };

    function renderGroups() {
        var groups = chart.root().selectAll("div.group")
            .data(nestEntries(), function(d) {
                return chart.keyRetriever()(d);
            });

        groups.enter().append("div")
            .attr("class", "group")
            .append("span")
            .attr("class", "label")
            .text(function(d) {
                return chart.keyRetriever()(d);
            });

        groups.exit().remove();

        return groups;
    }

    function nestEntries() {
        if (!sort)
            sort = crossfilter.quicksort.by(sortBy);

        var entries = chart.dimension().top(size);

        return d3.nest()
            .key(chart.group())
            .sortKeys(order)
            .entries(sort(entries, 0, entries.length));
    }

    function renderRows(groups) {
        var rows = groups.order()
            .selectAll("div.row")
            .data(function(d) {
                return d.values;
            });

        var rowEnter = rows.enter()
            .append("div")
            .attr("class", "row");

        for (var i = 0; i < columns.length; ++i) {
            var f = columns[i];
            rowEnter.append("span")
                .attr("class", "column " + i)
                .text(function(d) {
                    return f(d);
                });
        }

        rows.exit().remove();

        return rows;
    }

    chart.redraw = function() {
        return chart.render();
    };

    chart.size = function(s) {
        if (!arguments.length) return size;
        size = s;
        return chart;
    };

    chart.columns = function(_) {
        if (!arguments.length) return columns;
        columns = _;
        return chart;
    };

    chart.sortBy = function(_) {
        if (!arguments.length) return sortBy;
        sortBy = _;
        return chart;
    };

    chart.order = function(_) {
        if (!arguments.length) return order;
        order = _;
        return chart;
    };

    return chart.anchor(selector);
};
dc.bubbleChart = function(selector, hierarchical) {
    var NODE_CLASS = "node";
    var BUBBLE_CLASS = "bubble";
    var MIN_RADIUS = 10;

    var chart = dc.singleSelectionChart(dc.colorChart(dc.coordinateGridChart({})), hierarchical);

    chart.renderLabel(true);
    chart.renderTitle(false);

    var _r = d3.scale.linear().domain([0, 100]);
    var _rValueRetriever = function(d) {
        return d.r;
    };

    chart.transitionDuration(750);

    var bubbleLocator = function(d) {
        return "translate(" + (bubbleX(d)) + "," + (bubbleY(d)) + ")";
    };

    chart.plotData = function() {
         _r.range([0, chart.xAxisLength() / 3]);

        var bubbleG = chart.g().selectAll("g." + NODE_CLASS)
            .data(chart.group().all());

        renderNodes(bubbleG);

        updateNodes(bubbleG);

        removeNodes(bubbleG);

        chart.fadeDeselectedArea();
    };

    function renderNodes(bubbleG) {
        var bubbleGEnter = bubbleG.enter().append("g");
        bubbleGEnter
            .attr("class", NODE_CLASS)
            .attr("transform", bubbleLocator)
            .append("circle").attr("class", function(d, i) {
                return BUBBLE_CLASS + " " + i;
            })
            .on("click", onClick)
            .attr("fill", function(d, i) {
                return chart.colors()(i);
            })
            .attr("r", 0);
        dc.transition(bubbleG, chart.transitionDuration())
            .attr("r", function(d) {
                return bubbleR(d);
            });

        renderLabel(bubbleGEnter);

        renderTitles(bubbleGEnter);
    }

    var labelFunction = function(d) {
        return bubbleR(d) > MIN_RADIUS ? chart.label()(d) : "";
    };

    function renderLabel(bubbleGEnter) {
        if (chart.renderLabel()) {

            bubbleGEnter.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".3em")
                .on("click", onClick)
                .text(labelFunction);
        }
    }

    function updateLabels(bubbleGEnter) {
        if (chart.renderLabel()) {
            bubbleGEnter.selectAll("text")
                .text(labelFunction);
        }
    }

    var titleFunction = function(d) {
        return chart.title()(d);
    };

    function renderTitles(g) {
        if (chart.renderTitle()) {
            g.append("title").text(titleFunction);
        }
    }

    function updateTitles(g) {
        if (chart.renderTitle()) {
            g.selectAll("title").text(titleFunction);
        }
    }

    function updateNodes(bubbleG) {
        dc.transition(bubbleG, chart.transitionDuration())
            .attr("transform", bubbleLocator)
            .selectAll("circle." + BUBBLE_CLASS)
            .attr("r", function(d) {
                return bubbleR(d);
            });
        updateLabels(bubbleG);
        updateTitles(bubbleG);
    }

    function removeNodes(bubbleG) {
        dc.transition(bubbleG.exit().selectAll("circle." + BUBBLE_CLASS), chart.transitionDuration())
            .attr("r", 0)
            .remove();
    }

    var onClick = function(d) {
        chart.filter(d.key);
        dc.redrawAll();
    };

    function bubbleX(d) {
        return chart.x()(chart.keyRetriever()(d)) + chart.margins().left;
    }

    function bubbleY(d) {
        return chart.margins().top + chart.y()(chart.valueRetriever()(d));
    }

    function bubbleR(d) {
        return chart.r()(chart.radiusValueRetriever()(d));
    }

    chart.renderBrush = function(g) {
        // override default x axis brush from parent chart
    };

    chart.redrawBrush = function(g) {
        // override default x axis brush from parent chart
        chart.fadeDeselectedArea();
    };

    chart.fadeDeselectedArea = function() {
        var normalOpacity = 1;
        var fadeOpacity = 0.1;
        if (chart.hasFilter()) {
            chart.selectAll("g." + NODE_CLASS).select("circle").each(function(d) {
                if (chart.isSelectedSlice(d)) {
                    chart.highlightSelected(this);
                } else {
                    chart.fadeDeselected(this);
                }
            });
        } else {
            chart.selectAll("g." + NODE_CLASS).selectAll("circle").each(function(d) {
                chart.resetHighlight(this);
            });
        }
    };

    chart.isSelectedSlice = function(d) {
        return chart.filter() == d.key;
    };

    chart.r = function(_) {
        if (!arguments.length) return _r;
        _r = _;
        return chart;
    };

    chart.radiusValueRetriever = function(_) {
        if (!arguments.length) return _rValueRetriever;
        _rValueRetriever = _;
        return chart;
    };

    return chart.anchor(selector);
};
dc.compositeChart = function(selector) {
    var SUB_CHART_G_CLASS = "sub";

    var chart = dc.coordinateGridChart({});
    var children = [];

    chart.transitionDuration(500);

    dc.override(chart, "generateG", function(_super) {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.dimension() == null) child.dimension(chart.dimension());
            if (child.group() == null) child.group(chart.group());
            child.svg(chart.svg());
            child.height(chart.height());
            child.width(chart.width());
            child.margins(chart.margins());
            child.xUnits(chart.xUnits());
            child.transitionDuration(chart.transitionDuration());
            child.generateG();
            child.g().attr("class", "sub");
        }

        return _super();
    });

    chart.plotData = function() {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            child.x(chart.x());
            child.y(chart.y());
            child.xAxis(chart.xAxis());
            child.yAxis(chart.yAxis());

            child.plotData();
        }
    };

    chart.fadeDeselectedArea = function() {
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            child.brush(chart.brush());

            child.fadeDeselectedArea();
        }
    };

    chart.compose = function(charts) {
        children = charts;
        return chart;
    };

    return chart.anchor(selector);
};
