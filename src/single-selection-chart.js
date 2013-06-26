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

			if (f != null) {
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
    var _groupAlls = [];
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
				if (chart.dataAreSet())
				    chart.dimension().filter(f);
				if (_filters.length > 0) {
				    _filters.pop();
				}
				if (chart.dataAreSet())
				    chart.dimension().filter(f);
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
		};

		chart.dimension = function() {
			if (arguments.length) {
				throw "Cannot call dimension() with argument, must call addDimensionAndGroup(d, g, ga)";
			}
			return (_dimensions.length == 0) ? null : _dimensions[Math.min(
					_filters.length, _dimensions.length - 1)];
		};

		chart.group = function() {
			if (arguments.length) {
				throw "Cannot call group() with argument, must call addDimensionAndGroup(d, g, ga)";
			}
			return (_groups.length == 0) ? null : _groups[Math.min(
					_filters.length, _groups.length - 1)];
		};

		chart.groupAll = function() {
			if (arguments.length) {
				throw "Cannot call groupAll() with argument, must call addDimensionAndGroup(d, g, ga)";
			}
			return (_groupAlls.length == 0) ? null : _groupAlls[Math.min(
					_filters.length, _groupAlls.length - 1)];
		};


		chart.addDimensionAndGroup = function(d, g, ga) {
			_dimensions.push(d);
			_groups.push(g);
			_groupAlls.push(ga);
			return chart;
		};

	}

	return chart;
};
