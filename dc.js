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

dc._isDescendantNode = function(parent, child) {
    var node = child.parentNode;
     while (node != null) {
         if (node == parent) {
             return true;
         }
         node = node.parentNode;
     }
     return false;
};

dc.getChartFor = function(element) {
    for ( var i = 0; i < dc._charts.length; i++ ) {
        var ch = dc._charts[i];
	if ( dc._isDescendantNode(ch.root().node(), element) )
	    return ch;
    }
    return null;
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

dc.printers.emptyValueLabel = "(none)";

dc.printers.value = function(filter) {
	if ( filter == null || filter == undefined || filter === "" )
		return dc.printers.emptyValueLabel;
	else if (filter instanceof Date)
        return dc.dateFormat(filter);
    else if(typeof(filter) == "string")
        return filter;
    else if(typeof(filter) == "number")
        return Math.round(filter);
    else
    	return "" + filter;
};

dc.printers.filter = function(filter) {
     var valuePrinter = dc.printers.value;
     if (filter instanceof Array) {
            if (filter.length >= 2)
                return "[" + valuePrinter(filter[0]) + " -> " + valuePrinter(filter[1]) + "]";
            else if (filter.length >= 1)
                return valuePrinter(filter[0]);
     }
     return valuePrinter(filter);
};

dc.schema = function() {

    var CARDINALITY_THRESHOLD_TO_PRESERVE_VALUES = 20;

    var DATE_FORMATS = [
	d3.time.format.iso,
	d3.time.format("%Y-%m-%d %H:%M:%S"),
	d3.time.format("%Y-%m-%d"),
	d3.time.format("%m-%d-%Y %H:%M:%S"),
	d3.time.format("%m-%d-%Y"),
	d3.time.format("%m-%d-%Y %H:%M:%S")
    ];

    var parsePossibleDate = function(v) {
        for ( var i = 0; i < DATE_FORMATS.length; i++ ) {
	    var val = DATE_FORMATS[i].parse(v);
	    if ( val != null ) { return val; }
	}
	return null;
    };


    var schema = {};

    schema.coerceData = function(data, metadata) {
        // find all properies whose type is 'date'.
	var dateprops = {};
	for ( var name in metadata.properties ) {
	    if ( metadata.properties[name].type == "date" ) {
	        dateprops[name] = true;
		var md = metadata.properties[name]; 
		if ( md.minimum != null ) { 
		    md.minimum = parsePossibleDate(md.minimum);
		}
		if ( md.maximum != null ) {
		    md.maximum = parsePossibleDate(md.maximum);
		}
		
	    }
	}
	if ( ! dateprops ) { return; }
	for ( var i=0; i < data.length; i++ ) {
	    var d = data[i];
	    for ( var k in d ) {
	        if (  dateprops[k] ) {
		    d[k] = parsePossibleDate(d[k]);
		}
	    }
	}
    };

    var newFieldMetadata = function() { return { "required": true, "cardinality": 0 }; };

    var determineDataType = function(v, currentType, coerce) {
	var thisType = "unknown";
	var v_typeof = typeof(v);
	var coercedValue = v;
	var wasCoerced = false;
	if( Object.prototype.toString.call( v ) === '[object Array]' ) {
	    thisType = 'array';
	}
        else if ( v_typeof == "string" ) {
	    var pdate = parsePossibleDate(v);
	    if ( pdate != null ) {
		thisType = "date";
		if ( coerce ) {
		    coercedValue = pdate;
		    wasCoerced = true;
		}
	    }
	    else 
	        thisType = "string";
	}
	else if ( v_typeof == "number" ) 
	    thisType = "number";
	else if ( v_typeof == "integer" ) 
	    thisType = "integer";
	else if ( v_typeof == "boolean" ) 
	    thisType = "boolean";
	else if ( v.getMonth === "function" )
	    thisType = "date";
	
	if ( currentType != null && thisType != currentType ) {
	    if ( thisType == "number" && currentType == "integer" ) 
	        thisType = "number";
	    if ( thisType == "integer" && currentType == "number" ) 
	        thisType = "number";
	    if ( thisType == "date" && currentType == "string" ) 
	        thisType = "string";
	    else
	        thisType = "mixed";
	}
	return  { 'type' : thisType, 'coercedValue' : coercedValue, 'wasCoerced' : wasCoerced };
    };

    var objectSize = function(obj) {
        var size = 0;
	for ( var k in obj ) {
	    if ( obj.hasOwnProperty(k) ) size++;
	}
	return size;
    };

    schema.getMetadata = function(data, coerce) {
        var metadata = {};
	var props = {};
	metadata['properties'] = props;

	for ( var i = 0; i < data.length; i++ ) {
	    var item = data[i];
	    for ( var k in item ) {
	        var val = item[k];
		var fmd = props[k];
		if ( fmd == null ) {
		    fmd = newFieldMetadata();
		    props[k] = fmd;
		}
		if ( val == null ) {
		    fmd.required = false;
		}
		else {
		    var currentType = fmd.type;
		    var thisType = determineDataType(val, currentType, coerce);
		    if ( currentType == null ) 
		        fmd.type = thisType.type;
	            else if ( thisType.type != currentType ) 
		        fmd.type = "mixed";
		    if ( thisType.wasCoerced ) {
			val = thisType.coercedValue;
			item[k] = val;
		    }
		}

		var uniqs = fmd.values;
		if ( uniqs == null ) {
		    uniqs = {};
		    fmd.values = uniqs;
		}
		// val coerced to string for key, but kept intact for value.
		if ( uniqs[val] === undefined ) 
		    fmd.cardinality++;
		    uniqs[ val ] = val;
		// max and min.
		if ( fmd.minimum === undefined || val < fmd.minimum ) 
		    fmd.minimum = val;
		if ( fmd.maximum === undefined || val > fmd.maximum ) 
		    fmd.maximum = val;
	    }
	}

	for ( var fname in props ) {
	    var fmd = props[fname];
	    if ( fmd.cardinality >  CARDINALITY_THRESHOLD_TO_PRESERVE_VALUES ) {
		    delete fmd.values;
	    }
	}

	return metadata;
    };

    return schema;
}();
dc.chartStrategy = function() {

    var chartStrategy = {};

    chartStrategy.PIE_THRESHOLD = 5;
    chartStrategy.ATTRIBUTION_PROPERTIES = { 'channel': 1, 'subchannel': 2, 'source': 3, 'campaign': 4, 'subcampaign': 5 };
    chartStrategy.EXCLUDED_PROPERTIES = { 'coupon_ids' : true, 'website_id' : true };
    chartStrategy.STRING_CARDINALITY_THRESHOLD = 200;
    chartStrategy.STRING_CARDINALITY_PCT_THRESHOLD = .9;

    chartStrategy.VALUE_ACCESSORS = {
        "standard": function(name) { return function(d) { var v = d[name]; return v == null ? "" : v; } },
        "day": function(name) { return function(d) { 
		return d3.time.day(d[name]); 
	    } 
	},
        "hour": function(name) { return function(d) { return d[name] ? d[name].getHours() : null; } },
        "weekday": function(name) { var names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return function(d) { return d[name] != null ? names[d[name].getDay()] : null;  };  }
    };

    var computeDateDomain = function(minDate, maxDate) {
	var start = new Date(minDate.getTime());
	start.setHours(0);
	start.setMinutes(0);
	start.setSeconds(0);
	start.setMilliseconds(0);
	var end = new Date(maxDate.getTime() + 86400 * 1000);
	end.setHours(0);     
	end.setMinutes(0);
	end.setSeconds(0);
	end.setMilliseconds(0);
	return [ start, end ];
    };

    function cloneObject(obj) {
       if ( typeof(obj) != "object" ) return obj;
       var clone = {};
       for ( var k in obj ) {
          if ( obj.hasOwnProperty(k) ) 
	      clone[k] = cloneObject(obj[k]);
       }
       return clone;
    }

    var getFieldStrategy = function(data) {
        return function(propname, fm) {
	    // exclude under certain conditions
	    if ( chartStrategy.EXCLUDED_PROPERTIES[propname] ) 
		return null;
	    if ( fm.type == "string" && (!chartStrategy.ATTRIBUTION_PROPERTIES[propname]) &&
		 ( fm.cardinality > chartStrategy.STRING_CARDINALITY_THRESHOLD || 
		   fm.cardinality / data.length > chartStrategy.STRING_CARDINALITY_PCT_THRESHOLD ) )
		return null;

	    // chart type
	    var chart_type;
	    if ( fm.type == "date" ||
		 ( fm.type != "string" && fm.type != "array" && 
		   !(chartStrategy.ATTRIBUTION_PROPERTIES[propname]) && 
		   fm.cardinality > chartStrategy.PIE_THRESHOLD ) ) 
		chart_type = "bar";
	    else if ( fm.cardinality > chartStrategy.PIE_THRESHOLD ) 
		chart_type = "table";
	    else 
		chart_type = "pie";

	    // value accessor and dimension
	    // domain/scale, etc.
	    var value_accessor = null;
	    var domain = null;
	    var domainUnits = null;
	    var round = null;
	    if ( fm.treatment == "hour" && fm.type == "date" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.hour(propname);
		domain = d3.scale.linear().domain([0,24]);
		round = dc.round.floor;
	    }
	    else if ( fm.treatment == "weekday" && fm.type == "date" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.weekday(propname);
		chart_type = "pie";
	    }
	    else if ( fm.type == "date" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.day(propname);
		domain = d3.time.scale().domain(computeDateDomain(fm.minimum, fm.maximum));
		domainUnits = d3.time.days;
		round = d3.time.day.round;
	    }
	    else if ( chart_type == "bar" ) {
		value_accessor = chartStrategy.VALUE_ACCESSORS.standard(propname);
		var max_domain = ( fm.type == "integer" || fm.type == "number" ) ?  fm.maximum + 1 : fm.maximum;
		domain = d3.scale.linear().domain([fm.minimum, max_domain]);
		round = dc.round.floor;
	    }
	    else {
		value_accessor = chartStrategy.VALUE_ACCESSORS.standard(propname);
	    } 

	    // TODO group by sum, etc.

	    return {
		"field_name": propname,
		"type" : chart_type,
		"value_accessor" : value_accessor,
		"domain" : domain,
		"domainUnits" : domainUnits,
		"round" : round,
		"field_metadata": fm
	    };
        };
    };

    chartStrategy.getStrategy = function(data, metadata) {
        // given the metadata, make dimensions and groups.
	var charts = {};

	if ( ! data.length || ! metadata )
	    return charts;

	var gfs = getFieldStrategy(data);
	for ( var propname in metadata.properties ) {
	    var fm = metadata.properties[propname];
	    var chart_def = gfs(propname, fm);
	    if ( ! chart_def ) continue;

	    charts[propname] = chart_def;

	    // for date fields, push a special _hour dimension. and a _weekday dimension.
	    if ( fm.type == "date" ) {
	        var hour_fm = cloneObject(fm);
		hour_fm.treatment = 'hour';
		var hour_chart_def = gfs(propname, hour_fm);
		hour_chart_def.field_name = propname + "_hour";
		charts[propname + "_hour"] = hour_chart_def;
	        var wd_fm = cloneObject(fm);
		wd_fm.treatment = 'weekday';
		var wd_chart_def = gfs(propname, wd_fm);
		wd_chart_def.field_name = propname + "_weekday";
		charts[propname + "_weekday"] = wd_chart_def;
	    }
	}
	return charts;
    };

    return chartStrategy;
}();


dc.newCrossfilter = function(data, strategy) {
    var crfilt = crossfilter(data);
    var obj = { 
        "crossfilter": crfilt,
        "dimensions": {}, 
        "groups": {}, 
        "info": {}
    };  

    function dim_group(dim, info) {
        if ( info.type === 'array' ) {
	    return dim.groupAll().reduce(
		function(p,v) { var val = info.value_accessor(v); for ( var i = 0; i < val.length; i++ ) { p[val[i]] = (p[val[i]] || 0) + 1; } return p; },
		function(p,v) { var val = info.value_accessor(v); for ( var i = 0; i < val.length; i++ ) { p[val[i]] = (p[val[i]] || 1) - 1; } return p; },
		function() { return {}; }
	    );
	}
	else {
	    return dim.group();
	}
    }

    for ( var propname in strategy ) { 
        var info = strategy[propname];
        var dim = crfilt.dimension(info.value_accessor);
        var grp = dim_group(dim, info);
        obj.dimensions[propname] = dim;
        obj.groups[propname] = grp;
        obj.info[propname] = info;
    }   

    return obj;
};  

dc.chartBuilder = function() {

    var chartBuilder = {
	"defaultMargins" : {top: 10, right: 50, bottom: 30, left: 40},
	"defaultHeight" : 100,
	"defaultWidth" : 900,
	"defaultTransition" : 300,
	"defaultPieSize" : 180,
	"defaultPieRadius": 80,
	"defaultPieInnerRadius": 20,
	"defaultTableWidth": 200,
	"defaultTableHeight": 300
    };

    chartBuilder.chartDivBuilder = function(div, chart_info) {
        var title = div.append("div").classed("title", true).text(chart_info.field_name);
	title.append("span").classed("filter", true).style("display", "none")
	if ( chart_info.hierarchical ) {
	    title.append("span").classed("filter-pop", true)
	        .attr("onclick", "dc.getChartFor(this).popFilter();dc.redrawAll();return true;")
		.style("display", "none").text("back");
	}
	title.append("span").classed("reset", true)
	    .attr("onclick", "dc.getChartFor(this).filterAll();dc.redrawAll();return true;")
	    .style("display", "none").text("reset");
    };

    chartBuilder.build = function(selection, crossfilter_obj) {

	var charts = {};

	// collapse hierarchies into one composite.
	// only case handled so far is channel + et al.
	var hier = {};
	var hier_type = null;
	var hier_name = 'attribution';
	for ( var propname in crossfilter_obj.info ) {
	    if ( ! (propname in dc.chartStrategy.ATTRIBUTION_PROPERTIES) ) 
		continue;
	    if ( hier_type && crossfilter_obj.info[propname].type != hier_type )
		continue;
	    hier_type = crossfilter_obj.info[propname].type;
	    hier[propname] = crossfilter_obj.info[propname];
	}

	if (  hier_type ) {
	    var hlist = [];
	    for ( propname in hier ) {
		delete crossfilter_obj.info[propname];
		hlist.push(hier[propname]);
	    }
	    hlist.sort(
		function(a,b) { 
		    var pa = dc.chartStrategy.ATTRIBUTION_PROPERTIES[a.field_name], pb = dc.chartStrategy.ATTRIBUTION_PROPERTIES[b.field_name]; 
		    return pa < pb ? -1 : ( pa > pb ? 1 : 0 ); 
		} 
	    );
	    crossfilter_obj.info[hier_name] = hlist;
	    var dims = [];
	    var grps = [];
	    for ( var i = 0; i < hlist.length; i++ ) {
		var info = hlist[i];
		dims.push(crossfilter_obj.dimensions[info.field_name]);
		grps.push(crossfilter_obj.groups[info.field_name]);
		delete crossfilter_obj.dimensions[info.field_name];
		delete crossfilter_obj.groups[info.field_name];
	    }
	    crossfilter_obj.dimensions[hier_name] = dims;
	    crossfilter_obj.groups[hier_name] = grps;
	    crossfilter_obj.info[hier_name] = hlist[0];
	    crossfilter_obj.info[hier_name].hierarchical = true;
	}

	var propnames = [];
	for ( var propname in crossfilter_obj.info ) {
	    propnames.push(propname);
	}
	propnames.sort(
	    function(a,b) { 
		var pa = crossfilter_obj.info[a].type; 
		var pb = crossfilter_obj.info[b].type; 
		return (pa < pb) ? -1 : ( pa > pb ? 1 : 0 ); 
	    }
	);

	// the base charts div.
	var charts_div = selection.select("#charts");
	if ( charts_div.empty() )
	    charts_div = selection.append("div").attr("id", "charts").classed("charts", true);

	// put the charts in child divs.
	for ( var i = 0; i < propnames.length; i++ ) {
	    var propname = propnames[i];
	    var info = crossfilter_obj.info[propname];
	    var selector = propname + "-chart";
	    if ( selection.select("#" + selector).empty() ) {
		var chart_div = charts_div.append("div").attr("id", selector)
		    .classed("chart", true).classed(info.type + "-chart", true);
		chartBuilder.chartDivBuilder(chart_div, info);
	    }
	    var chart = null;
	    if ( info.type == "bar" ) {
		chart = dc.barChart("#" + selector)
		.width(chartBuilder.defaultWidth)
		.height(chartBuilder.defaultHeight)
		.transitionDuration(chartBuilder.defaultTransition)
		.margins(chartBuilder.defaultMargins)
		.dimension(crossfilter_obj.dimensions[propname])
		.group(crossfilter_obj.groups[propname])
		.elasticY(true)
		.x(info.domain)
		.round(info.round);
		if ( info.domainUnits ) { chart.xUnits(info.domainUnits); }
	    }
	    else if ( info.type == "pie" ) {
		var dim = crossfilter_obj.dimensions[propname];
		var grp = crossfilter_obj.groups[propname];
		chart = dc.pieChart("#" + selector, Array.isArray(dim))
		.width(chartBuilder.defaultPieSize)
		.height(chartBuilder.defaultPieSize)
		.radius(chartBuilder.defaultPieRadius)
		.innerRadius(chartBuilder.defaultPieInnerRadius)
		.transitionDuration(chartBuilder.defaultTransition)
		.renderTitle(true);

		if ( Array.isArray(dim) ) {
		    for ( var j = 0; j < dim.length; j++ ) {
			chart.addDimensionAndGroup(dim[j], grp[j]);
		    }
		}
		else {
		    chart.dimension(dim).group(grp);
		}
	    }
	    else if ( info.type == "table" ) {
		var dim = crossfilter_obj.dimensions[propname];
		var grp = crossfilter_obj.groups[propname];
		chart = dc.leaderboardChart("#" + selector, Array.isArray(dim))
		.width(chartBuilder.defaultTableWidth)
		.height(chartBuilder.defaultTableHeight)
		.transitionDuration(chartBuilder.defaultTransition)
		.renderTitle(true);

		if ( Array.isArray(dim) ) {
		    for ( var j = 0; j < dim.length; j++ ) {
			chart.addDimensionAndGroup(dim[j], grp[j]);
		    }
		}
		else {
		    chart.dimension(dim).group(grp);
		}
	    }
	    charts[selector] = chart;
	}

	// a reset-all link
	selection.append("div")
	    .attr("id", "#reset-all").classed("reset", true)
	    .attr("onclick", "dc.filterAll();dc.redrawAll();return true")
	    .text("Reset all");

	// a data-count
	var dc_div = selection.append("div").attr("id", "data-count");
	dc_div.append("span").classed("filter-count", true).text("-");
	dc_div.append("span").text(" (");
	dc_div.append("span").classed("filter-pct", true).text("-");
	dc_div.append("span").text(") of ");
	dc_div.append("span").classed("total-count", true).text("-");
	dc_div.append("span").text(" items selected.");

	charts['data-count'] = dc.dataCount("#data-count")
	                         .dimension(crossfilter_obj.crossfilter)
				 .group(crossfilter_obj.crossfilter.groupAll());

	// TODO a data-table

	return charts;
    };

    return chartBuilder;
}();


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
        chart.select(".reset").style("display", null);
        chart.select(".filter-pop").style("display", null);
        chart.select(".filter").text(chart.filterText()).style("display", null);
    };

    chart.turnOffControls = function() {
        chart.select(".reset").style("display", "none");
        chart.select(".filter-pop").style("display", "none");
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

dc.leaderboardChart = function(selector, hierarchical) {

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
      chart.selectAll("div.row").remove();

      if (chart.dataAreSet()) {

        dataPie = calculateDataPie();
        
        var rowEnter = chart.root()
          .selectAll("div.row")
          .data(dataPie(filteredData(chart.group().top(Infinity))))
          .enter()
          .append("div")
          .attr("class", "row");


        var columns = [
            function(d) {
              return d.data.key;
            },
            function(d) {
              return d.data.value;
            }
          ];
        
        for (var i = 0; i < columns.length; ++i) {
              var f = columns[i];
              rowEnter.append("span")
                  .attr("class", "column column-" + i + (columns.length - i == 1 ? " last-column" : ""))
                  .text(function(d) {
                      return f(d);
                  })
                  .on('click', onClick);
        }
      }

      return chart;
    };

    chart.redraw = function() {
      chart.render();
    };

    function calculateDataPie() {
        return d3.layout.pie().value(function(d) {
            return chart.valueRetriever()(d);
        });
    }

    function filteredData(data) {
      var newdata = [];
      for ( var i = 0; i < data.length; i++ ) {
        if ( chart.valueRetriever()(data[i]) > 0 ) newdata.push(data[i]);
      }
      return newdata;
    }

    function onClick(d) {
        chart.filter(chart.keyRetriever()(d.data));
        dc.redrawAll();
    }

    return chart.anchor(selector);
};
dc.dataCount = function(selector) {
    var formatNumber = d3.format(",d");
    var formatPct = d3.format("2.1f");
    var chart = dc.baseChart({});

    chart.render = function() {
	var total = chart.dimension().size();
	var filt = chart.group().value();
        chart.selectAll(".total-count").text(formatNumber(total));
        chart.selectAll(".filter-count").text(formatNumber(filt));
        chart.selectAll(".filter-pct").text(( total == 0 ) ? "-" : (formatPct(filt/total*100.0) + "%"));

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
                .attr("class", "column column-" + i + (columns.length - i == 1 ? " last-column" : ""))
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
